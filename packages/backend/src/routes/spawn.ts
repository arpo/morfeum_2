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
    try {
      // Import individual pipeline functions for step-by-step execution
      const { generateCharacterSeed, generateCharacterImage, analyzeCharacterImage, enrichCharacterProfile } = 
        await import('../engine/generation');
      
      // Step 1: Generate seed
      const seed = await generateCharacterSeed(prompt.trim(), apiKey);
      
      // Emit seed complete event
      eventEmitter.emit({
        type: 'spawn:seed-complete',
        data: {
          spawnId,
          seed,
          systemPrompt: '' // System prompt can be added later
        }
      });
      
      // Step 2: Generate image
      const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey);
      
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
      const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey);
      
      // Step 4: Enrich profile
      const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey);
      
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
          enhancedSystemPrompt: undefined, // System prompt handling to be added later
          entityType: 'character'
        }
      });

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
 * POST /api/spawn/start - OLD SYSTEM: Start a new spawn process (deprecated, use /engine/start)
 */
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
  const { prompt, entityType = 'character' } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid prompt is required',
      error: 'Missing or invalid prompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (entityType !== 'character' && entityType !== 'location') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid entity type',
      error: 'entityType must be either "character" or "location"',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spawnManager = getSpawnManager((req as any).mzooApiKey);
  const spawnId = spawnManager.startSpawn(prompt.trim(), entityType);

  res.status(HTTP_STATUS.OK).json({
    message: 'Spawn process started',
    data: { 
      spawnId, 
      entityType
    },
    timestamp: new Date().toISOString(),
  });
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
