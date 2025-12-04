/**
 * Hierarchy Routes - Full hierarchy creation
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { createHierarchy, createProgressConfig, type HierarchySpec } from '../../engine/nodeCreation';
import { processTracker } from '../../engine/pipelines/shared/processTracker';
import { sseService } from '../../services/SSEService';
import { pipelineConfigs, generateSpawnId } from './shared';

const router = Router();

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
 * - { host: "London", region: "Camden", location: "Pub", niche: "Inside" } - Full hierarchy
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

  const spawnId = generateSpawnId('hier');
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
      duration: 3000,
    }))
  });

  // Create abort controller and track process
  const abortController = new AbortController();
  const prompt = spec.host || spec.region || spec.location || spec.niche || '';
  processTracker.startProcess(spawnId, prompt, 'location', abortController);

  // Send immediate response
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
      processTracker.completeProcess(spawnId, 'completed');
    })
    .catch((error) => {
      if (error.message === 'Aborted') {
        sseService.sendEvent(spawnId, 'cancelled', { message: 'Hierarchy creation cancelled' });
        processTracker.completeProcess(spawnId, 'cancelled');
      } else {
        sseService.sendEvent(spawnId, 'error', { 
          message: 'Hierarchy creation failed',
          error: error.message 
        });
        processTracker.completeProcess(spawnId, 'error', error.message);
      }
    })
    .finally(() => {
      processTracker.removeProcess(spawnId);
      pipelineConfigs.delete(spawnId);
    });
}));

export { router as hierarchyRouter };
