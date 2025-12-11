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
import { runNodeCreationPipeline } from '../engine/pipelines/nodeCreationPipeline';
import { sseService } from '../services/SSEService';
import { getStepsForPipeline } from '../engine/pipelines/shared/pipelineConfig';
import { parsePromptToHierarchy } from '../engine/nodeCreation/detection/parsePromptToHierarchy';
import type { HierarchyStructure, HierarchyNode } from '../engine/hierarchyAnalysis/types';
import { 
  createNode, 
  createHierarchy, 
  createProgressConfig,
  formatProgressForSSE,
  type NodeType,
  type HierarchySpec,
} from '../engine/nodeCreation';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Store spawn managers per API key (in production, consider a more robust solution)
const spawnManagers = new Map<string, ReturnType<typeof createSpawnManager>>();

// Track active pipeline abort controllers by spawnId
const activeAbortControllers = new Map<string, AbortController>();

// Track pipeline configurations for SSE initialization
const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

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

  // Store pipeline configuration for SSE initialization (BEFORE sending response)
  const steps = getStepsForPipeline('character');
  pipelineConfigs.set(spawnId, {
    pipelineType: 'character',
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });

  // Create abort controller for this spawn
  const abortController = new AbortController();
  activeAbortControllers.set(spawnId, abortController);

  // Send immediate response
  res.status(HTTP_STATUS.OK).json({
    message: 'Character spawn started (new engine)',
    data: { spawnId, entityType, engine: 'new', eventsUrl: `/api/spawn/events/${spawnId}` },
    timestamp: new Date().toISOString(),
  });

  // Start pipeline (SSE will send config when connection establishes)
  runCharacterPipeline(prompt.trim(), apiKey, abortController.signal, spawnId)
    .finally(() => {
      activeAbortControllers.delete(spawnId);
      pipelineConfigs.delete(spawnId);
    });
}));

/**
 * POST /api/spawn/location/start - Start hierarchy-based location spawn with SSE
 * 
 * USES NEW NODE CREATION PIPELINE
 * - Sends response IMMEDIATELY for instant UI feedback
 * - Pipeline handles detection at start and sends updated config if interior detected
 * - Frontend updates step count based on SSE config events
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

  // Use default pipeline type - pipeline will detect interior and send updated config via SSE
  const pipelineType = 'worldTree';

  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline(pipelineType);
  pipelineConfigs.set(spawnId, {
    pipelineType,
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });

  // Create abort controller for this spawn
  const abortController = new AbortController();
  activeAbortControllers.set(spawnId, abortController);

  // Send IMMEDIATE response - no blocking operations before this
  res.status(HTTP_STATUS.OK).json({
    message: 'Location spawn started (new nodeCreation pipeline)',
    data: { 
      spawnId, 
      entityType: 'location', 
      engine: 'nodeCreation', 
      pipelineType,
      eventsUrl: `/api/spawn/events/${spawnId}` 
    },
    timestamp: new Date().toISOString(),
  });

  // Start pipeline - it will detect interior and send updated config if needed
  runNodeCreationPipeline(spawnId, prompt.trim(), apiKey, abortController.signal)
    .finally(() => {
      activeAbortControllers.delete(spawnId);
      pipelineConfigs.delete(spawnId);
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

  // Get pipeline config if available
  const config = pipelineConfigs.get(spawnId);
  
  sseService.addConnection(spawnId, res, config);
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

// =============================================================================
// NEW NODE CREATION SYSTEM ROUTES
// =============================================================================

/**
 * POST /api/spawn/node/:nodeType - Create a single node (host, region, location, niche)
 * 
 * Body: { prompt: string, parentId?: string, createImage?: boolean }
 * 
 * Examples:
 * - POST /api/spawn/node/host { prompt: "London" }
 * - POST /api/spawn/node/region { prompt: "Camden", parentId: "host-123" }
 * - POST /api/spawn/node/niche { prompt: "Inside the pub", parentId: "loc-123", createImage: true }
 */
router.post('/node/:nodeType', asyncHandler(async (req: Request, res: Response) => {
  const { nodeType } = req.params as { nodeType: NodeType };
  const { prompt, parentId, createImage = false, perspective } = req.body;

  // Validate node type
  const validNodeTypes: NodeType[] = ['host', 'region', 'location', 'niche'];
  if (!validNodeTypes.includes(nodeType)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid node type',
      error: `nodeType must be one of: ${validNodeTypes.join(', ')}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid prompt is required',
      error: 'Missing or invalid prompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate parentId for non-host nodes
  if (nodeType !== 'host' && !parentId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Parent ID required',
      error: `${nodeType} nodes require a parentId`,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spawnId = `node-${nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = (req as any).mzooApiKey;

  // Create abort controller
  const abortController = new AbortController();
  activeAbortControllers.set(spawnId, abortController);

  try {
    const result = await createNode(nodeType, prompt.trim(), {
      apiKey,
      parentId,
      createImage,
      perspective,
      spawnId,
    });

    activeAbortControllers.delete(spawnId);

    res.status(HTTP_STATUS.OK).json({
      message: `${nodeType} node created successfully`,
      data: {
        spawnId,
        nodeType,
        node: result.node,
        imageUrl: result.imageUrl,
        imagePrompt: result.imagePrompt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    activeAbortControllers.delete(spawnId);
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Node creation failed',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * POST /api/spawn/hierarchy - Create a full hierarchy from spec
 * 
 * Body: { 
 *   host?: string, 
 *   region?: string, 
 *   location?: string, 
 *   niche?: string,
 *   createImage?: boolean 
 * }
 * 
 * Examples:
 * - { host: "London" } - Just a host with image
 * - { host: "London", region: "Camden", location: "Pub", niche: "Inside" } - Full hierarchy, image on niche
 */
router.post('/hierarchy', asyncHandler(async (req: Request, res: Response) => {
  const { host, region, location, niche, createImage = true } = req.body;

  // Validate at least one level is provided
  if (!host && !region && !location && !niche) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'At least one hierarchy level required',
      error: 'Provide at least one of: host, region, location, niche',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spec: HierarchySpec = {};
  if (host) spec.host = host;
  if (region) spec.region = region;
  if (location) spec.location = location;
  if (niche) spec.niche = niche;

  const spawnId = `hier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = (req as any).mzooApiKey;

  // Calculate progress steps
  const progressConfig = createProgressConfig(spec, createImage);
  
  // Store pipeline configuration for SSE
  pipelineConfigs.set(spawnId, {
    pipelineType: 'hierarchy',
    steps: progressConfig.steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: 3000, // Estimated duration per step
    }))
  });

  // Create abort controller
  const abortController = new AbortController();
  activeAbortControllers.set(spawnId, abortController);

  // Send immediate response with events URL
  res.status(HTTP_STATUS.OK).json({
    message: 'Hierarchy creation started',
    data: { 
      spawnId, 
      spec,
      totalSteps: progressConfig.steps.length,
      eventsUrl: `/api/spawn/events/${spawnId}` 
    },
    timestamp: new Date().toISOString(),
  });

  // Start hierarchy creation
  createHierarchy(spec, {
    apiKey,
    spawnId,
    createImage,
    signal: abortController.signal,
  })
    .then((result) => {
      // Send completion event
      sseService.sendEvent(spawnId, 'completed', {
        stage: 'hierarchy_complete',
        message: 'Hierarchy created successfully',
        data: {
          rootNode: result.rootNode,
          nodes: result.nodes,
          imageUrl: result.imageUrl,
          imagePrompt: result.imagePrompt,
          depth: result.depth,
        }
      });
    })
    .catch((error) => {
      if (error.message === 'Aborted') {
        sseService.sendEvent(spawnId, 'cancelled', { message: 'Hierarchy creation cancelled' });
      } else {
        sseService.sendEvent(spawnId, 'error', { 
          message: 'Hierarchy creation failed',
          error: error.message 
        });
      }
    })
    .finally(() => {
      activeAbortControllers.delete(spawnId);
      pipelineConfigs.delete(spawnId);
    });
}));

// =============================================================================
// ORIGINAL ROUTES
// =============================================================================

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
