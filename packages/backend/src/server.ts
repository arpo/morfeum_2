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
  // Increase limit to 10MB to handle large world/character data
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

  const server = app.listen(config.port, () => {
    console.log(`🚀 Backend server is running at http://localhost:${config.port}`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
    console.log(`📁 Frontend build path: ${config.frontendBuildPath}`);
    console.log(`🔗 API endpoints available at:`);
    console.log(`   GET  http://localhost:${config.port}/api`);
    console.log(`   GET  http://localhost:${config.port}/api/info`);
    console.log(`   GET  http://localhost:${config.port}/health`);
    console.log(`   GET  http://localhost:${config.port}/health/detailed`);
  });

  // Graceful shutdown handling - close server before exiting to release port
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
    // Force exit after 5s if server.close hangs
    setTimeout(() => process.exit(0), 5000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };
