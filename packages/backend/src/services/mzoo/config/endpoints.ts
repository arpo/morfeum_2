/**
 * MZOO API Configuration
 */

export const MZOO_API_BASE = 'https://www.mzoo.app/api/v1';

export const ENDPOINTS = {
  TEXT_GENERATION: `${MZOO_API_BASE}/ai/gemini/text`,
  VISION_ANALYSIS: `${MZOO_API_BASE}/ai/vision`,
  IMAGE_GENERATION: `${MZOO_API_BASE}/ai/fal-flux-srpo/generate`,
  IMAGE_EDIT: `${MZOO_API_BASE}/ai/fal-flux-2-turbo-edit/edit`,
  IMAGE_UPSCALE: `${MZOO_API_BASE}/ai/seedvr-upscale-image/upscale`,
  DEPTH_MAP: `${MZOO_API_BASE}/ai/fal-depth-anything-v2/process`
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

export const DEFAULT_IMAGE_EDIT_SETTINGS = {
  NUM_IMAGES: 1,
  IMAGE_SIZE: 'landscape_16_9',
  GUIDANCE_SCALE: 2.5,
  OUTPUT_FORMAT: 'jpeg',
  ENABLE_SAFETY_CHECKER: false
};

export const DEFAULT_IMAGE_UPSCALE_SETTINGS = {
  UPSCALE_MODE: 'factor',
  UPSCALE_FACTOR: 2,
  TARGET_RESOLUTION: '1080p',
  NOISE_SCALE: 0.1,
  OUTPUT_FORMAT: 'jpg'
};
