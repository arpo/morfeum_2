/**
 * MZOO Service
 * API service layer for MZOO AI services
 */

// Export all service functions
export { generateText } from './services/textGeneration';
export { analyzeImage } from './services/visionAnalysis';
export { analyzeImageCached, type CachedVisionResponse } from './services/cachedVisionAnalysis';
export { generateImage } from './services/imageGeneration';
export { editImage } from './services/imageEdit';
export { upscaleImage } from './services/imageUpscale';
export { generateDepthMap } from './services/depthMapGeneration';
export { generateVideo } from './services/videoGeneration';

// Export cached text generation services
export { 
  generateCachedText, 
  generateCachedTextWithThinking,
  type ThinkingConfig,
  type CachedTextResponse 
} from './services/cachedTextGeneration';

// Export cache management services
export { 
  ensureCache, 
  invalidateCache, 
  invalidateAllCaches,
  refreshCacheTTL,
  listCaches,
  clearCacheStore,
  type CacheInfo 
} from './services/cacheService';

// Export cache group types
export type { CacheGroupId } from '../../engine/generation/prompts/cacheContent';

// Export types
export * from './types';

// Export configuration (optional, for advanced users)
export { ENDPOINTS, DEFAULT_MODELS, DEFAULT_IMAGE_SETTINGS, DEFAULT_IMAGE_EDIT_SETTINGS, DEFAULT_IMAGE_UPSCALE_SETTINGS, DEFAULT_VIDEO_SETTINGS } from './config/endpoints';
