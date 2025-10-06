/**
 * MZOO API authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../config';

/**
 * Validates MZOO API key from environment variables
 */
export const validateMzooApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const MZOO_API_KEY = process.env.MZOO_API_KEY;
  
  if (!MZOO_API_KEY) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'MZOO API key not configured',
      error: 'Missing MZOO_API_KEY environment variable',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // Attach API key to request for use in route handlers
  (req as any).mzooApiKey = MZOO_API_KEY;
  next();
};
