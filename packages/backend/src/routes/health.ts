/**
 * Health check routes
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { HealthResponse } from '../types';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * Basic health check endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  
  const healthData: HealthResponse = {
    status: 'OK',
    timestamp,
    uptime: Math.floor(uptime),
  };

  res.status(HTTP_STATUS.OK).json(healthData);
}));

/**
 * Detailed health check endpoint
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  const memoryUsage = process.memoryUsage();
  
  const healthData = {
    status: 'OK',
    timestamp,
    uptime: Math.floor(uptime),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    },
    version: process.version,
    platform: process.platform,
    nodeEnv: process.env.NODE_ENV || 'development',
  };

  res.status(HTTP_STATUS.OK).json(healthData);
}));

export { router as healthRouter };
