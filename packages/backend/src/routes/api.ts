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
        { method: 'GET', path: '/api/test', description: 'MZOO test data' },
        { method: 'GET', path: '/health', description: 'Basic health check' },
        { method: 'GET', path: '/health/detailed', description: 'Detailed health check' },
      ],
    },
    timestamp: new Date().toISOString(),
  };

  res.status(HTTP_STATUS.OK).json(responseData);
}));

/**
 * MZOO test endpoint - Proxies request to MZOO API
 */
router.get('/test', asyncHandler(async (req: Request, res: Response) => {
  const MZOO_API_KEY = process.env.MZOO_API_KEY;
  
  if (!MZOO_API_KEY) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'MZOO API key not configured',
      error: 'Missing MZOO_API_KEY environment variable',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const response = await fetch('https://www.mzoo.app/api/v1/data/test/1', {
    headers: {
      'Authorization': `Bearer ${MZOO_API_KEY}`
    }
  });
  
  if (!response.ok) {
    res.status(response.status).json({
      message: 'Failed to fetch from MZOO API',
      error: `HTTP error! status: ${response.status}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  const data = await response.json();
  res.status(HTTP_STATUS.OK).json({
    message: 'MZOO test data fetched successfully',
    data: data.data,
    timestamp: new Date().toISOString(),
  });
}));

export { router as apiRouter };
