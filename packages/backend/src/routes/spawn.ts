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

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Store spawn managers per API key (in production, consider a more robust solution)
const spawnManagers = new Map<string, ReturnType<typeof createSpawnManager>>();

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

    try {
      // Import hierarchy analyzer
      const { analyzeHierarchy } = await import('../engine/hierarchyAnalysis');
      
      // Analyze hierarchy (emits events during process)
      const result = await analyzeHierarchy(prompt.trim(), apiKey);
      
      // ⚠️ PIPELINE STOPPED - Don't emit complete event yet
      // TODO: Emit complete event after DNA and image generation are refactored
      // eventEmitter.emit({
      //   type: 'hierarchy:complete',
      //   data: {
      //     spawnId,
      //     hierarchy: result.hierarchy,
      //     metadata: result.metadata,
      //     imageUrl: result.imageUrl,
      //     entityType: 'location'
      //   }
      // });

      // Log classification result only
      const totalTime = Date.now() - pipelineStartTime;
      console.log(`\n[HierarchyPipeline] ${spawnId} classification completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Entity Type: location`);
      console.log(`  Layers: ${result.metadata.layersDetected.join(' → ')}`);
      console.log(`  Total Nodes: ${result.metadata.totalNodes}`);
      console.log(`  ⚠️  Pipeline stopped after classification - no DNA or image generation\n`);

    } catch (error: any) {
      console.error('[Hierarchy Route] Pipeline failed:', error);
      eventEmitter.emit({
        type: 'hierarchy:error',
        data: {
          spawnId,
          error: error.message || 'Unknown error',
          stage: 'hierarchy-analysis'
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
