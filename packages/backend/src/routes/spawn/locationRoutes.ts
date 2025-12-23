/**
 * Location spawn routes
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { runNodeCreationPipeline } from '../../engine/pipelines/nodeCreationPipeline';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { activeAbortControllers, pipelineConfigs } from './shared';

const router = Router();

/**
 * POST /start - Start hierarchy-based location spawn with SSE
 * 
 * USES NEW NODE CREATION PIPELINE
 * - Sends response IMMEDIATELY for instant UI feedback
 * - Pipeline handles detection at start and sends updated config if interior detected
 * - Frontend updates step count based on SSE config events
 */
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
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

export { router as locationRouter };
