/**
 * Character Spawn Routes - Character generation pipeline
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { runCharacterPipeline } from '../../engine/generation';
import { processTracker } from '../../engine/pipelines/shared/processTracker';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs, generateSpawnId } from './shared';

const router = Router();

/**
 * POST /api/spawn/engine/start - Start character spawn with new pipeline
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

  const spawnId = generateSpawnId('char');
  const apiKey = (req as any).mzooApiKey;

  // Store pipeline configuration for SSE initialization
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

  // Create abort controller and track process
  const abortController = new AbortController();
  processTracker.startProcess(spawnId, prompt.trim(), 'character', abortController);

  // Send immediate response
  res.status(HTTP_STATUS.OK).json({
    message: 'Character spawn started (new engine)',
    data: { spawnId, entityType, engine: 'new', eventsUrl: `/api/spawn/events/${spawnId}` },
    timestamp: new Date().toISOString(),
  });

  // Start pipeline
  runCharacterPipeline(prompt.trim(), apiKey, abortController.signal, spawnId)
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

export { router as characterRouter };
