/**
 * CORS configuration middleware
 */

import { Request, Response, NextFunction } from 'express';
import { CORS_CONFIG } from '../config';

/**
 * Custom CORS middleware for cross-origin requests
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', CORS_CONFIG.ORIGIN);
  res.header('Access-Control-Allow-Methods', CORS_CONFIG.METHODS.join(', '));
  res.header('Access-Control-Allow-Headers', CORS_CONFIG.ALLOWED_HEADERS.join(', '));
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
};
