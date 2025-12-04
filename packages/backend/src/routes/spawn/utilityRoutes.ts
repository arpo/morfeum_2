/**
 * Spawn Utility Routes - SSE events, cancellation, and status
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { processTracker } from '../../engine/pipelines/shared/processTracker';
import { sseService } from '../../services/SSEService';
import { pipelineConfigs } from './shared';


const router = Router();

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

  const cancelled = processTracker.cancelProcess(spawnId);
  
  if (cancelled) {
    sseService.closeConnection(spawnId);
    console.log(`[Spawn] Cancelled active pipeline: ${spawnId}`);
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Spawn process cancelled',
    data: { spawnId, cancelled },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/spawn/active - Get all active spawn processes
 */
router.get('/active', asyncHandler(async (req: Request, res: Response) => {
  const activeProcesses = processTracker.getActiveProcesses();

  res.status(HTTP_STATUS.OK).json({
    message: 'Active spawn processes retrieved',
    data: {
      count: activeProcesses.length,
      processes: activeProcesses.map((p) => ({
        id: p.id,
        prompt: p.prompt,
        entityType: p.entityType,
        status: p.status,
        createdAt: p.createdAt
      }))
    },
    timestamp: new Date().toISOString(),
  });
}));

export { router as utilityRouter };
