/**
 * Spawn API routes - Entity generation pipeline management
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { asyncHandler } from '../middleware';
import { validateMzooApiKey } from '../middleware/mzooAuth';
import { createSpawnManager, SpawnProcess } from '../services/spawn';
import { eventEmitter } from '../services/eventEmitter';
import { SublocPipelineManager } from '../services/spawn/managers/SublocPipelineManager';
import { runCharacterPipeline } from '../engine/generation';
import type { HierarchyStructure, HierarchyNode } from '../engine/hierarchyAnalysis/types';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Store spawn managers per API key (in production, consider a more robust solution)
const spawnManagers = new Map<string, ReturnType<typeof createSpawnManager>>();

/**
 * Build node chain from hierarchy (deepest node + all parents)
 * Returns complete node objects to preserve visual enrichment fields
 */
function buildNodeChain(hierarchy: HierarchyStructure): HierarchyNode[] {
  const chain: HierarchyNode[] = [];
  
  // Start with host (complete object)
  chain.push(hierarchy.host);
  
  // Find deepest node path and push complete objects
  if (hierarchy.host.regions && hierarchy.host.regions.length > 0) {
    const region = hierarchy.host.regions[0]; // Take first region
    chain.push(region);
    
    if (region.locations && region.locations.length > 0) {
      const location = region.locations[0]; // Take first location
      chain.push(location);
      
      if (location.niches && location.niches.length > 0) {
        const niche = location.niches[0]; // Take first niche
        chain.push(niche);
      }
    }
  }
  
  return chain;
}

/**
 * Get or create spawn manager for the current API key
 */
function getSpawnManager(apiKey: string): ReturnType<typeof createSpawnManager> {
  if (!spawnManagers.has(apiKey)) {
    spawnManagers.set(apiKey, createSpawnManager(apiKey));
  }
  return spawnManagers.get(apiKey)!;
}

/**
 * SSE endpoint - Server-Sent Events stream for spawn updates
 */
router.get('/events', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

  // Generate client ID
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Register client
  eventEmitter.addClient(clientId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    eventEmitter.removeClient(clientId);
    res.end();
  });
});

/**
 * POST /api/spawn/engine/start - NEW ENGINE: Start character spawn with new pipeline
 */
router.post('/engine/start', asyncHandler(async (req: Request, res: Response) => {
  const { prompt, entityType = 'character' } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid prompt is required',
      error: 'Missing or invalid prompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (entityType !== 'character') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Only character type supported in new engine',
      error: 'entityType must be "character" (location coming soon)',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spawnId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = (req as any).mzooApiKey;

  // Send immediate response
  res.status(HTTP_STATUS.OK).json({
    message: 'Character spawn started (new engine)',
    data: { spawnId, entityType, engine: 'new' },
    timestamp: new Date().toISOString(),
  });

  // Run pipeline asynchronously with SSE events (emitting intermediate events)
  (async () => {
    const pipelineStartTime = Date.now();
    const timings = {
      seedGeneration: 0,
      imageGeneration: 0,
      visualAnalysis: 0,
      profileEnrichment: 0
    };

    try {
      // Import individual pipeline functions for step-by-step execution
      const { 
        generateCharacterSeed, 
        generateCharacterImage, 
        analyzeCharacterImage, 
        enrichCharacterProfile,
        generateInitialSystemPrompt,
        generateEnhancedSystemPrompt
      } = await import('../engine/generation');
      
      // Step 1: Generate seed
      const seedStartTime = Date.now();
      const seed = await generateCharacterSeed(prompt.trim(), apiKey);
      timings.seedGeneration = Date.now() - seedStartTime;
      
      // Generate initial system prompt from seed
      const systemPrompt = generateInitialSystemPrompt(seed);
      
      // Emit seed complete event
      eventEmitter.emit({
        type: 'spawn:seed-complete',
        data: {
          spawnId,
          seed,
          systemPrompt
        }
      });
      
      // Step 2: Generate image
      const imageStartTime = Date.now();
      const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey);
      timings.imageGeneration = Date.now() - imageStartTime;
      
      // Emit image complete event
      eventEmitter.emit({
        type: 'spawn:image-complete',
        data: {
          spawnId,
          imageUrl,
          imagePrompt
        }
      });
      
      // Step 3: Analyze image
      const analysisStartTime = Date.now();
      const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey);
      timings.visualAnalysis = Date.now() - analysisStartTime;
      
      // Step 4: Enrich profile
      const enrichStartTime = Date.now();
      const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey);
      timings.profileEnrichment = Date.now() - enrichStartTime;
      
      // Generate enhanced system prompt from deep profile
      const enhancedSystemPrompt = generateEnhancedSystemPrompt(deepProfile);
      
      // Emit profile complete event
      eventEmitter.emit({
        type: 'spawn:profile-complete',
        data: {
          spawnId,
          deepProfile: {
            ...deepProfile,
            imageUrl,
            imagePrompt,
            seed,
            visualAnalysis
          },
          enhancedSystemPrompt,
          entityType: 'character'
        }
      });

      // Log completion with timing breakdown
      const totalTime = Date.now() - pipelineStartTime;
      console.log(`\n[CharacterPipeline] ${spawnId} completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Entity Type: character`);
      console.log(`  Stage Timings:`);
      console.log(`    - Seed Generation:     ${(timings.seedGeneration / 1000).toFixed(2)}s`);
      console.log(`    - Image Generation:    ${(timings.imageGeneration / 1000).toFixed(2)}s`);
      console.log(`    - Visual Analysis:     ${(timings.visualAnalysis / 1000).toFixed(2)}s`);
      console.log(`    - Profile Enrichment:  ${(timings.profileEnrichment / 1000).toFixed(2)}s`);
      console.log(`  Total:                   ${(totalTime / 1000).toFixed(2)}s\n`);

    } catch (error: any) {
      console.error('[Engine Route] Pipeline failed:', error);
      eventEmitter.emit({
        type: 'spawn:error',
        data: {
          spawnId,
          error: error.message || 'Unknown error',
          stage: 'pipeline'
        }
      });
    }
  })();
}));

/**
 * POST /api/spawn/location/start - NEW: Start hierarchy-based location spawn
 */
router.post('/location/start', asyncHandler(async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid prompt is required',
      error: 'Missing or invalid prompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spawnId = `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = (req as any).mzooApiKey;

  // Send immediate response
  res.status(HTTP_STATUS.OK).json({
    message: 'Location spawn started (hierarchy system)',
    data: { spawnId, entityType: 'location', engine: 'hierarchy' },
    timestamp: new Date().toISOString(),
  });

  // Run hierarchy analysis asynchronously with SSE events
  (async () => {
    const pipelineStartTime = Date.now();
    const timings = {
      hierarchyClassification: 0,
      imageGeneration: 0,
      visualAnalysis: 0,
      dnaGeneration: 0
    };

    try {
      // Import hierarchy analyzer and image generation
      const { analyzeHierarchy, generateBatchDNA } = await import('../engine/hierarchyAnalysis');
      const { generateImage, analyzeImage } = await import('../services/mzoo');
      const { locationImageGeneration } = await import('../engine/generation/prompts/locationImageGeneration');
      const { locationVisualAnalysisPrompt } = await import('../engine/generation/prompts');
      const { parseJSON } = await import('../engine/utils/parseJSON');
      const { fetchImageAsBase64 } = await import('../services/spawn/shared/pipelineCommon');
      const { AI_MODELS } = await import('../config/constants');
      
      // Stage 1: Hierarchy Classification
      const classificationStart = Date.now();
      const result = await analyzeHierarchy(prompt.trim(), apiKey);
      timings.hierarchyClassification = Date.now() - classificationStart;
      
      // Stage 2: Build node chain and generate image prompt
      const nodeChain = buildNodeChain(result.hierarchy);
      const imagePrompt = locationImageGeneration(prompt.trim(), nodeChain);
      
      // Emit image prompt generated event
      eventEmitter.emit({
        type: 'hierarchy:image-prompt-generated',
        data: {
          spawnId,
          imagePrompt,
          nodeChain
        }
      });
      
      // Stage 3: Generate image
      const imageStart = Date.now();
      const imageResult = await generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');
      timings.imageGeneration = Date.now() - imageStart;
      
      if (imageResult.error || !imageResult.data?.images?.[0]?.url) {
        throw new Error(imageResult.error || 'Image URL not found in response');
      }
      
      const imageUrl = imageResult.data.images[0].url;
      
      // Emit image complete event
      eventEmitter.emit({
        type: 'hierarchy:image-complete',
        data: {
          spawnId,
          imageUrl,
          imagePrompt
        }
      });

      // Stage 4: Visual Analysis
      const analysisStart = Date.now();
      
      // Fetch image as base64
      const base64Image = await fetchImageAsBase64(imageUrl);
      
      // Generate visual analysis prompt
      const analysisPrompt = locationVisualAnalysisPrompt(prompt.trim(), nodeChain);
      
      // Analyze image
      const analysisResult = await analyzeImage(
        apiKey,
        base64Image,
        analysisPrompt,
        'image/jpeg',
        AI_MODELS.VISUAL_ANALYSIS
      );
      
      if (analysisResult.error || !analysisResult.data) {
        console.error('[LocationPipeline] Visual analysis API error:', analysisResult.error);
        throw new Error(analysisResult.error || 'No data returned from visual analysis');
      }
      
      const visualAnalysis = parseJSON(analysisResult.data.text);
      timings.visualAnalysis = Date.now() - analysisStart;
      
      // Stage 4.5: Merge visual analysis scene fields into target node
      // Find target node (deepest node in chain)
      const targetNode = nodeChain[nodeChain.length - 1];
      let targetNodeRef: any = null;
      
      // Navigate to target node in hierarchy
      if (targetNode.type === 'location' && result.hierarchy.host.regions) {
        const region = result.hierarchy.host.regions[0];
        if (region?.locations?.[0]) {
          targetNodeRef = region.locations[0];
        }
      } else if (targetNode.type === 'niche' && result.hierarchy.host.regions) {
        const region = result.hierarchy.host.regions[0];
        if (region?.locations?.[0]?.niches?.[0]) {
          targetNodeRef = region.locations[0].niches[0];
        }
      }
      
      // Merge scene fields into node root (not DNA)
      if (targetNodeRef && visualAnalysis) {
        targetNodeRef.looks = visualAnalysis.looks;
        targetNodeRef.atmosphere = visualAnalysis.atmosphere;
        targetNodeRef.lighting = visualAnalysis.lighting;
        targetNodeRef.dominantElements = visualAnalysis.dominantElements;
        targetNodeRef.spatialLayout = visualAnalysis.spatialLayout;
        targetNodeRef.uniqueIdentifiers = visualAnalysis.uniqueIdentifiers;
        targetNodeRef.materials_primary = visualAnalysis.materials_primary;
        targetNodeRef.materials_secondary = visualAnalysis.materials_secondary;
        targetNodeRef.materials_accents = visualAnalysis.materials_accents;
        targetNodeRef.colors_dominant = visualAnalysis.colors_dominant;
        targetNodeRef.colors_secondary = visualAnalysis.colors_secondary;
        targetNodeRef.colors_accents = visualAnalysis.colors_accents;
        targetNodeRef.colors_ambient = visualAnalysis.colors_ambient;
        targetNodeRef.navigableElements = visualAnalysis.navigableElements;
        targetNodeRef.searchDesc = visualAnalysis.searchDesc;
        targetNodeRef.imageUrl = imageUrl;
      }
      
      // Stage 5: Batch DNA Generation for all nodes
      const dnaStart = Date.now();
      
      // Generate DNA for entire hierarchy
      const fullHierarchy = await generateBatchDNA(
        result.hierarchy,
        visualAnalysis,
        prompt.trim(),
        apiKey
      );
      
      timings.dnaGeneration = Date.now() - dnaStart;
      
      // Emit complete hierarchy with all DNA
      eventEmitter.emit({
        type: 'hierarchy:complete',
        data: {
          spawnId,
          hierarchy: fullHierarchy,
          metadata: result.metadata,
          imageUrl
        }
      });

      // Log timing breakdown
      const totalTime = Date.now() - pipelineStartTime;
      console.log(`\n[LocationPipeline] ${spawnId} completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Entity Type: location`);
      console.log(`  Stage Timings:`);
      console.log(`    - Hierarchy Classification: ${(timings.hierarchyClassification / 1000).toFixed(2)}s`);
      console.log(`    - Image Generation:         ${(timings.imageGeneration / 1000).toFixed(2)}s`);
      console.log(`    - Visual Analysis:          ${(timings.visualAnalysis / 1000).toFixed(2)}s`);
      console.log(`    - DNA Generation:           ${(timings.dnaGeneration / 1000).toFixed(2)}s`);
      console.log(`  Total:                        ${(totalTime / 1000).toFixed(2)}s\n`);

    } catch (error: any) {
      console.error('[LocationPipeline] Pipeline failed:', error);
      eventEmitter.emit({
        type: 'hierarchy:error',
        data: {
          spawnId,
          error: error.message || 'Unknown error',
          stage: 'location-pipeline'
        }
      });
    }
  })();
}));

/**
 * POST /api/spawn/sublocation/start - Start a sublocation spawn process
 */
router.post('/sublocation/start', asyncHandler(async (req: Request, res: Response) => {
  const { sublocationName, parentNodeId, cascadedContext, createImage = true, scaleHint = 'interior' } = req.body;

  if (!sublocationName || typeof sublocationName !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid sublocation name is required',
      error: 'Missing or invalid sublocationName in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!parentNodeId || typeof parentNodeId !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid parent node ID is required',
      error: 'Missing or invalid parentNodeId in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!cascadedContext || typeof cascadedContext !== 'object') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid cascaded context is required',
      error: 'Missing or invalid cascadedContext in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Generate unique spawn ID
  const spawnId = `subloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // console.log('[Spawn Route] 📥 Received sublocation request:', {
  //   sublocationName,
  //   scaleHint,
  //   hasScaleHint: scaleHint !== undefined,
  //   scaleHintValue: scaleHint
  // });

  // Start pipeline in background
  const pipeline = new SublocPipelineManager({
    spawnId,
    sublocationName,
    parentNodeId,
    cascadedContext,
    createImage,
    scaleHint,
    mzooApiKey: (req as any).mzooApiKey
  });
  
  // console.log('[Spawn Route] 🚀 Created pipeline with scaleHint:', scaleHint);

  // Run pipeline asynchronously (don't await)
  pipeline.run().catch(error => {
    console.error('[Spawn] Sublocation pipeline failed:', error);
  });

  res.status(HTTP_STATUS.OK).json({
    message: 'Sublocation spawn process started',
    data: { 
      spawnId,
      sublocationName,
      parentNodeId,
      createImage
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * DELETE /api/spawn/:spawnId - Cancel a spawn process
 */
router.delete('/:spawnId', asyncHandler(async (req: Request, res: Response) => {
  const { spawnId } = req.params;

  if (!spawnId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Spawn ID is required',
      error: 'Missing spawnId in URL parameters',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spawnManager = getSpawnManager((req as any).mzooApiKey);
  spawnManager.cancelSpawn(spawnId);

  res.status(HTTP_STATUS.OK).json({
    message: 'Spawn process cancelled',
    data: { spawnId },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/spawn/active - Get all active spawn processes
 */
router.get('/active', asyncHandler(async (req: Request, res: Response) => {
  const spawnManager = getSpawnManager((req as any).mzooApiKey);
  const activeProcesses = spawnManager.getActiveProcesses();

  res.status(HTTP_STATUS.OK).json({
    message: 'Active spawn processes retrieved',
    data: {
      count: activeProcesses.length,
      processes: activeProcesses.map((p: SpawnProcess) => ({
        id: p.id,
        prompt: p.prompt,
        status: p.status,
        createdAt: p.createdAt
      }))
    },
    timestamp: new Date().toISOString(),
  });
}));

export { router as spawnRouter };
