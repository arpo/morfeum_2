/**
 * Location Spawn Routes - Location generation pipeline
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { runNodeCreationPipeline } from '../../engine/pipelines/nodeCreationPipeline';
import { processTracker } from '../../engine/pipelines/shared/processTracker';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs, generateSpawnId } from './shared';

const router = Router();

/**
 * POST /api/spawn/location/start - Start hierarchy-based location spawn with SSE
 * 
 * USES NEW NODE CREATION PIPELINE
 * - Parses prompt to detect depth (host only, host/region, host/region/location, or full with niche)
 * - Creates single-branch hierarchy
 * - Defaults to Host/Region/Location (exterior) unless "inside/interior" mentioned
 * - Uses per-node-type DNA prompts
 * - Uses PipelineHelper for proper SSE events
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

  const spawnId = generateSpawnId('loc');
  const apiKey = (req as any).mzooApiKey;

  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline('worldTree');
  pipelineConfigs.set(spawnId, {
    pipelineType: 'worldTree',
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });

  // Create abort controller and track process
  const abortController = new AbortController();
  processTracker.startProcess(spawnId, prompt.trim(), 'location', abortController);

  // Send immediate response
  res.status(HTTP_STATUS.OK).json({
    message: 'Location spawn started (new nodeCreation pipeline)',
    data: { spawnId, entityType: 'location', engine: 'nodeCreation', eventsUrl: `/api/spawn/events/${spawnId}` },
    timestamp: new Date().toISOString(),
  });

  // Start pipeline
  runNodeCreationPipeline(spawnId, prompt.trim(), apiKey, abortController.signal)
    .then(() => {
      processTracker.completeProcess(spawnId, 'completed');
    })
    .catch((error) => {
      processTracker.completeProcess(spawnId, 'error', error?.message);
    })
    .finally(() => {
      processTracker.removeProcess(spawnId);
      pipelineConfigs.delete(spawnId);
    });
}));

export { router as locationRouter };
