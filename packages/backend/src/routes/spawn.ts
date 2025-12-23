/**
 * Spawn API routes - Entity generation pipeline management
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { asyncHandler } from '../middleware';
import { validateMzooApiKey } from '../middleware/mzooAuth';
import { SpawnProcess } from '../services/spawn';
import { sseService } from '../services/SSEService';
import { getSpawnManager, activeAbortControllers, pipelineConfigs } from './spawn/shared';
import { engineRouter } from './spawn/engineRoutes';
import { locationRouter } from './spawn/locationRoutes';
import { nodeRouter } from './spawn/nodeRoutes';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Mount sub-routers
router.use('/engine', engineRouter);
router.use('/location', locationRouter);
router.use('/', nodeRouter);

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
