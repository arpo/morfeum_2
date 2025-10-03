/**
 * Static file serving service
 */

import express from 'express';
import { ServerConfig } from '../types';
import { getStaticFilePath, validatePath } from '../utils';

/**
 * Configure static file serving middleware
 */
export const configureStaticFiles = (app: express.Application, config: ServerConfig): void => {
  // Validate the frontend build path
  if (!validatePath(config.frontendBuildPath)) {
    console.warn(`Warning: Frontend build path may not exist: ${config.frontendBuildPath}`);
  }

  // Serve static files from the frontend build directory
  app.use(express.static(config.frontendBuildPath));
};

/**
 * Configure catch-all handler for client-side routing
 */
export const configureCatchAllHandler = (app: express.Application, config: ServerConfig): void => {
  // Catch-all to serve index.html for client-side routing
  app.get('*', (req: express.Request, res: express.Response) => {
    const indexPath = getStaticFilePath('index.html', config.frontendBuildPath);
    res.sendFile(indexPath);
  });
};

/**
 * Get static file configuration info
 */
export const getStaticFileConfig = (config: ServerConfig) => {
  return {
    buildPath: config.frontendBuildPath,
    isValid: validatePath(config.frontendBuildPath),
    indexPath: getStaticFilePath('index.html', config.frontendBuildPath),
  };
};
