/**
 * MZOO Cache Management Routes
 * Endpoints for managing Gemini Explicit Caches during development
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { 
  listCaches, 
  invalidateAllCaches, 
  invalidateCache, 
  clearCacheStore 
} from '../../services/mzoo';
import type { CacheGroupId } from '../../engine/generation/prompts/cacheContent';

const router = Router();

/**
 * List all caches
 * GET /api/mzoo/cache
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const caches = await listCaches((req as any).mzooApiKey);
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Caches retrieved successfully',
    data: {
      caches,
      count: caches.length
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Flush all caches (delete from server + clear local memory)
 * POST /api/mzoo/cache/flush
 */
router.post('/flush', asyncHandler(async (req: Request, res: Response) => {
  console.log('[CacheRoutes] Flushing all caches...');
  
  // Clear local in-memory cache store
  clearCacheStore();
  console.log('[CacheRoutes] Local cache store cleared');
  
  // Invalidate all caches on MZOO server
  await invalidateAllCaches((req as any).mzooApiKey);
  console.log('[CacheRoutes] Server caches invalidated');
  
  res.status(HTTP_STATUS.OK).json({
    message: 'All caches flushed successfully',
    data: {
      localCleared: true,
      serverInvalidated: true
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Flush specific cache group
 * POST /api/mzoo/cache/flush/:groupId
 */
router.post('/flush/:groupId', asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  
  // Validate groupId
  const validGroups: CacheGroupId[] = [
    'morfeum-world-creation',
    'morfeum-character-creation',
    'morfeum-navigation',
    'morfeum-chat'
  ];
  
  if (!validGroups.includes(groupId as CacheGroupId)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid cache group ID',
      error: `Valid groups are: ${validGroups.join(', ')}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  console.log(`[CacheRoutes] Flushing cache group: ${groupId}`);
  
  await invalidateCache((req as any).mzooApiKey, groupId as CacheGroupId);
  
  res.status(HTTP_STATUS.OK).json({
    message: `Cache group '${groupId}' flushed successfully`,
    data: {
      groupId,
      invalidated: true
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Clear local cache store only (doesn't delete from server)
 * POST /api/mzoo/cache/clear-local
 */
router.post('/clear-local', asyncHandler(async (req: Request, res: Response) => {
  console.log('[CacheRoutes] Clearing local cache store...');
  
  clearCacheStore();
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Local cache store cleared successfully',
    data: {
      localCleared: true,
      serverInvalidated: false
    },
    timestamp: new Date().toISOString(),
  });
}));

export { router as cacheRouter };
