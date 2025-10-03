/**
 * Main server entry point
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import { getConfig } from './config';
import { corsMiddleware, errorHandler, notFoundHandler } from './middleware';
import { configureRoutes } from './routes';
import { configureStaticFiles, configureCatchAllHandler } from './services';

/**
 * Create and configure Express application
 */
function createApp(): express.Application {
  const app = express();
  const config = getConfig();

  // Middleware configuration
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(corsMiddleware);

  // Configure routes (must be before static files)
  configureRoutes(app);

  // Configure static file serving
  configureStaticFiles(app, config);

  // Configure catch-all handler for client-side routing
  configureCatchAllHandler(app, config);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
function startServer(): void {
  const app = createApp();
  const config = getConfig();

  app.listen(config.port, () => {
    console.log(`🚀 Backend server is running at http://localhost:${config.port}`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
    console.log(`📁 Frontend build path: ${config.frontendBuildPath}`);
    console.log(`🔗 API endpoints available at:`);
    console.log(`   GET  http://localhost:${config.port}/api`);
    console.log(`   GET  http://localhost:${config.port}/api/info`);
    console.log(`   GET  http://localhost:${config.port}/health`);
    console.log(`   GET  http://localhost:${config.port}/health/detailed`);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };
