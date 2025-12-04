/**
 * Node Creation Routes - Single node creation (host, region, location, niche)
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { createNode, type NodeType } from '../../engine/nodeCreation';
import { processTracker } from '../../engine/pipelines/shared/processTracker';
import { generateSpawnId } from './shared';

const router = Router();

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

  const spawnId = generateSpawnId(`node-${nodeType}`);
  const apiKey = (req as any).mzooApiKey;

  // Create abort controller and track process
  const abortController = new AbortController();
  processTracker.startProcess(spawnId, prompt.trim(), 'location', abortController);

  try {
    const result = await createNode(nodeType, prompt.trim(), {
      apiKey,
      parentId,
      createImage,
      perspective,
      spawnId,
    });

    processTracker.completeProcess(spawnId, 'completed');
    processTracker.removeProcess(spawnId);

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
    processTracker.completeProcess(spawnId, 'error', error?.message);
    processTracker.removeProcess(spawnId);
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Node creation failed',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}));

export { router as nodeRouter };
