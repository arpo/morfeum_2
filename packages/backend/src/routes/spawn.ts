/**
 * Spawn API routes - Entity generation pipeline management
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { asyncHandler } from '../middleware';
import { validateMzooApiKey } from '../middleware/mzooAuth';
import { createSpawnManager, SpawnProcess } from '../services/spawn';
import { runCharacterPipeline } from '../engine/generation';
import { WorldTreeBuilder } from '../services/worldTree/builder';
import { runWorldTreePipeline } from '../engine/pipelines/worldTreePipeline';
import { sseService } from '../services/SSEService';
import type { HierarchyStructure, HierarchyNode } from '../engine/hierarchyAnalysis/types';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Store spawn managers per API key (in production, consider a more robust solution)
const spawnManagers = new Map<string, ReturnType<typeof createSpawnManager>>();

// Track active pipeline abort controllers by spawnId
const activeAbortControllers = new Map<string, AbortController>();

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

  // Create abort controller for this spawn
  const abortController = new AbortController();
  activeAbortControllers.set(spawnId, abortController);

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
      
      // Check if cancelled
      if (abortController.signal.aborted) {
        console.log(`[CharacterPipeline] ${spawnId} cancelled after seed generation`);
        return;
      }
      
      // Generate initial system prompt from seed
      const systemPrompt = generateInitialSystemPrompt(seed);
      
      // Step 2: Generate image
      const imageStartTime = Date.now();
      const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey);
      timings.imageGeneration = Date.now() - imageStartTime;
      
      // Check if cancelled
      if (abortController.signal.aborted) {
        console.log(`[CharacterPipeline] ${spawnId} cancelled after image generation`);
        return;
      }
      
      // Step 3: Analyze image
      const analysisStartTime = Date.now();
      const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey);
      timings.visualAnalysis = Date.now() - analysisStartTime;
      
      // Check if cancelled
      if (abortController.signal.aborted) {
        console.log(`[CharacterPipeline] ${spawnId} cancelled after visual analysis`);
        return;
      }
      
      // Step 4: Enrich profile
      const enrichStartTime = Date.now();
      const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey);
      timings.profileEnrichment = Date.now() - enrichStartTime;
      
      // Check if cancelled
      if (abortController.signal.aborted) {
        console.log(`[CharacterPipeline] ${spawnId} cancelled after profile enrichment`);
        return;
      }
      
      // Generate enhanced system prompt from deep profile
      const enhancedSystemPrompt = generateEnhancedSystemPrompt(deepProfile);
      
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
      if (abortController.signal.aborted) {
        console.log(`[CharacterPipeline] ${spawnId} cancelled`);
      } else {
        console.error('[Engine Route] Pipeline failed:', error);
      }
    } finally {
      // Clean up abort controller
      activeAbortControllers.delete(spawnId);
    }
  })();
}));

/**
 * POST /api/spawn/location/start - Start hierarchy-based location spawn with SSE
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

  // Create abort controller for this spawn
  const abortController = new AbortController();
  activeAbortControllers.set(spawnId, abortController);

  // Send immediate response
  res.status(HTTP_STATUS.OK).json({
    message: 'Location spawn started (hierarchy system)',
    data: { spawnId, entityType: 'location', engine: 'hierarchy', eventsUrl: `/api/spawn/events/${spawnId}` },
    timestamp: new Date().toISOString(),
  });

  // Run hierarchy analysis asynchronously with SSE events
  // The new runWorldTreePipeline handles all steps and SSE events
  runWorldTreePipeline(spawnId, prompt.trim(), apiKey, abortController.signal)
    .finally(() => {
      activeAbortControllers.delete(spawnId);
    });
}));

/**
 * GET /api/spawn/events/:spawnId - SSE Stream for spawn events
 */
router.get('/events/:spawnId', asyncHandler(async (req: Request, res: Response) => {
  const { spawnId } = req.params;
  
  if (!spawnId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Spawn ID is required',
    });
    return;
  }

  sseService.addConnection(spawnId, res);
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

  // Abort new engine pipeline if active
  const abortController = activeAbortControllers.get(spawnId);
  if (abortController) {
    abortController.abort();
    activeAbortControllers.delete(spawnId);
    
    // Also close SSE connection
    sseService.closeConnection(spawnId);
    
    console.log(`[Spawn] Cancelled active pipeline: ${spawnId}`);
  }

  // Also cancel through old spawn manager (for backwards compatibility)
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
