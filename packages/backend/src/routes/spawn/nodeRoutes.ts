/**
 * Node creation routes - Single nodes and hierarchy creation
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { sseService } from '../../services/SSEService';
import { 
  createNode, 
  createHierarchy, 
  createProgressConfig,
  type NodeType,
  type HierarchySpec,
} from '../../engine/nodeCreation';
import { activeAbortControllers, pipelineConfigs } from './shared';

const router = Router();

/**
 * POST /node/:nodeType - Create a single node (host, region, location, niche)
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
 * POST /hierarchy - Create a full hierarchy from spec
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

export { router as nodeRouter };
