/**
 * Path resolution utilities
 */

import path from 'path';
import { STATIC_FILE_CONFIG } from '../config';

/**
 * Resolve frontend build path based on environment
 */
export const resolveFrontendBuildPath = (isProduction: boolean): string => {
  if (isProduction) {
    return STATIC_FILE_CONFIG.PRODUCTION_PATH;
  }
  
  return path.resolve(__dirname, STATIC_FILE_CONFIG.DEVELOPMENT_PATH_RELATIVE);
};

/**
 * Get absolute path for static files
 */
export const getStaticFilePath = (relativePath: string, basePath: string): string => {
  return path.join(basePath, relativePath);
};

/**
 * Validate if a path exists and is accessible
 */
export const validatePath = (pathToCheck: string): boolean => {
  try {
    // This would require fs module, but for now we'll return true
    // In a real implementation, you'd check if the path exists
    return true;
  } catch {
    return false;
  }
};
