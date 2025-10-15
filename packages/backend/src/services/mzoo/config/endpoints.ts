/**
 * MZOO API Configuration
 */

export const MZOO_API_BASE = 'https://www.mzoo.app/api/v1';

export const ENDPOINTS = {
  TEXT_GENERATION: `${MZOO_API_BASE}/ai/gemini/text`,
  VISION_ANALYSIS: `${MZOO_API_BASE}/ai/vision`,
  IMAGE_GENERATION: `${MZOO_API_BASE}/ai/fal-flux-srpo/generate`
};

export const DEFAULT_MODELS = {
  TEXT: 'gemini-2.5-flash',
  VISION: 'gemini-2.5-flash',
  IMAGE: 'fal-flux-srpo'
};

export const DEFAULT_IMAGE_SETTINGS = {
  NUM_IMAGES: 1,
  IMAGE_SIZE: 'landscape_16_9',
  ACCELERATION: 'high'
};
