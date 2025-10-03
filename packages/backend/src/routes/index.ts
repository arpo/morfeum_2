/**
 * Routes module exports and configuration
 */

import { Router } from 'express';
import { API_ROUTES } from '../config';
import { apiRouter } from './api';
import { healthRouter } from './health';

/**
 * Configure all application routes
 */
export const configureRoutes = (app: any): void => {
  // API routes
  app.use(API_ROUTES.ROOT, apiRouter);
  
  // Health check routes
  app.use(API_ROUTES.HEALTH, healthRouter);
};

/**
 * Export individual routers for testing or modular use
 */
export { apiRouter, healthRouter };

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
