/**
 * MZOO Service
 * API service layer for MZOO AI services
 */

// Export all service functions
export { generateText } from './services/textGeneration';
export { analyzeImage } from './services/visionAnalysis';
export { generateImage } from './services/imageGeneration';

// Export types
export * from './types';

// Export configuration (optional, for advanced users)
export { ENDPOINTS, DEFAULT_MODELS, DEFAULT_IMAGE_SETTINGS } from './config/endpoints';
