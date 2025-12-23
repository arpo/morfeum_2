/**
 * Character engine spawn routes
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { runCharacterPipeline } from '../../engine/generation';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { activeAbortControllers, pipelineConfigs } from './shared';

const router = Router();

/**
 * POST /engine/start - Start character spawn with new pipeline
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

export { router as engineRouter };
