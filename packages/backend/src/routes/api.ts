/**
 * API routes
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * Root API endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).send('Hello from the backend API!');
}));

/**
 * API info endpoint
 */
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  const responseData: ApiResponse = {
    message: 'Morfeum Backend API',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      endpoints: [
        { method: 'GET', path: '/api', description: 'Root API endpoint' },
        { method: 'GET', path: '/api/info', description: 'API information' },
        { method: 'GET', path: '/health', description: 'Basic health check' },
        { method: 'GET', path: '/health/detailed', description: 'Detailed health check' },
      ],
    },
    timestamp: new Date().toISOString(),
  };

  res.status(HTTP_STATUS.OK).json(responseData);
}));

export { router as apiRouter };
