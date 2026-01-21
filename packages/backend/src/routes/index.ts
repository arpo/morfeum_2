/**
 * Routes module exports and configuration
 */

import { Router } from 'express';
import { API_ROUTES } from '../config';
import { apiRouter } from './api';
import { healthRouter } from './health';
import { mzooRouter } from './mzoo';
import { spawnRouter } from './spawn';
import storageRouter from './storage';
import mediaRouter from './media';
import trainingDataRouter from './trainingData';
import videoProxyRouter from './videoProxy';
import { validateMzooApiKey } from '../middleware/mzooAuth';
import { worldV2Router } from '../worldV2';

/**
 * Configure all application routes
 */
export const configureRoutes = (app: any): void => {
  // API routes
  app.use(API_ROUTES.ROOT, apiRouter);
  
  // MZOO API routes
  app.use(`${API_ROUTES.ROOT}/mzoo`, mzooRouter);
  
  // Spawn management routes
  app.use(`${API_ROUTES.ROOT}/spawn`, spawnRouter);
  
  // Storage routes (for worlds persistence)
  app.use(API_ROUTES.ROOT, storageRouter);
  
  // Media routes (for media assets)
  app.use(`${API_ROUTES.ROOT}/media`, mediaRouter);
  
  // Training data routes (for AI model training)
  app.use(`${API_ROUTES.ROOT}/training-data`, trainingDataRouter);
  
  // Video proxy routes (for CORS-enabled video streaming)
  app.use(`${API_ROUTES.ROOT}/proxy`, videoProxyRouter);
  
  // ============================================
  // V2 World System Routes
  // TODO: Remove when V2 is stable and old system is removed
  // ============================================
  app.use(`${API_ROUTES.ROOT}/v2`, validateMzooApiKey, worldV2Router);
  
  // Health check routes
  app.use(API_ROUTES.HEALTH, healthRouter);
};

/**
 * Export individual routers for testing or modular use
 */
export { apiRouter, healthRouter, mzooRouter, spawnRouter, storageRouter, mediaRouter, trainingDataRouter, videoProxyRouter };

/**
 * Get all available routes information
 */
export const getRoutesInfo = () => {
  return [
    {
      prefix: API_ROUTES.ROOT,
      routes: [
        { method: 'GET', path: '/api', description: 'Root API endpoint' },
        { method: 'GET', path: '/api/info', description: 'API information' },
      ],
    },
    {
      prefix: API_ROUTES.HEALTH,
      routes: [
        { method: 'GET', path: '/health', description: 'Basic health check' },
        { method: 'GET', path: '/health/detailed', description: 'Detailed health check' },
      ],
    },
  ];
};
