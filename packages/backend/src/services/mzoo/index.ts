/**
 * MZOO Service
 * API service layer for MZOO AI services
 */

// Export all service functions
export { generateText } from './services/textGeneration';
export { analyzeImage } from './services/visionAnalysis';
export { generateImage } from './services/imageGeneration';
export { generateDepthMap } from './services/depthMapGeneration';

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
export { ENDPOINTS, DEFAULT_MODELS, DEFAULT_IMAGE_SETTINGS } from './config/endpoints';
