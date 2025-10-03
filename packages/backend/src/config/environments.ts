/**
 * Environment-specific configurations
 */

import { ServerConfig } from '../types';
import { DEFAULT_PORT, DEFAULT_NODE_ENV, STATIC_FILE_CONFIG } from './constants';
import path from 'path';

/**
 * Development environment configuration
 */
export const developmentConfig = (): ServerConfig => ({
  port: parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
  nodeEnv: process.env.NODE_ENV || DEFAULT_NODE_ENV,
  frontendBuildPath: path.resolve(__dirname, STATIC_FILE_CONFIG.DEVELOPMENT_PATH_RELATIVE),
});

/**
 * Production environment configuration
 */
export const productionConfig = (): ServerConfig => ({
  port: parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  frontendBuildPath: STATIC_FILE_CONFIG.PRODUCTION_PATH,
});

/**
 * Test environment configuration
 */
export const testConfig = (): ServerConfig => ({
  port: parseInt(process.env.PORT || String(DEFAULT_PORT + 1), 10),
  nodeEnv: 'test',
  frontendBuildPath: path.resolve(__dirname, STATIC_FILE_CONFIG.DEVELOPMENT_PATH_RELATIVE),
});

/**
 * Get configuration based on current environment
 */
export const getConfig = (): ServerConfig => {
  const nodeEnv = process.env.NODE_ENV || DEFAULT_NODE_ENV;
  
  switch (nodeEnv) {
    case 'production':
      return productionConfig();
    case 'test':
      return testConfig();
    case 'development':
    default:
      return developmentConfig();
  }
};
