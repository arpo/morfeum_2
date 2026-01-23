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
  DEPTH_MAP: `${MZOO_API_BASE}/ai/fal-depth-anything-v2/process`,
  VIDEO_GENERATION: `${MZOO_API_BASE}/ai/seedance-1-fast/generate`
};

export const DEFAULT_MODELS = {
  TEXT: 'gemini-2.5-flash',
  VISION: 'gemini-2.5-flash-lite',
  IMAGE: 'fal-flux-srpo'
};

export const DEFAULT_IMAGE_SETTINGS = {
  NUM_IMAGES: 1,
  IMAGE_SIZE: 'landscape_16_9',
  ACCELERATION: 'high'
};

export const DEFAULT_IMAGE_EDIT_SETTINGS = {
  NUM_IMAGES: 1,
  IMAGE_SIZE: { width: 1440, height: 816 },  // Max 1440px, 16:9 ratio, divisible by 16
  GUIDANCE_SCALE: 2.5,
  OUTPUT_FORMAT: 'png',  // PNG for better quality before upscaling
  ENABLE_SAFETY_CHECKER: false
};

export const DEFAULT_IMAGE_UPSCALE_SETTINGS = {
  UPSCALE_MODE: 'factor',
  UPSCALE_FACTOR: 2,        // 2.0x upscale as recommended
  TARGET_RESOLUTION: '1080p',
  NOISE_SCALE: 0.15,        // 0.1-0.2 range to avoid hallucination
  OUTPUT_FORMAT: 'png'      // PNG mandatory for quality
};

export const DEFAULT_VIDEO_SETTINGS = {
  PROVIDER: 'replicate' as const,
  ASPECT_RATIO: '16:9' as const,
  RESOLUTION: '480p' as const,
  DURATION: 5,
  CHARACTER_DURATION: 7,
  FPS: 24,
  CAMERA_FIXED: true,       // Fixed camera for seamless loops
  OUTPUT_FORMAT: 'mp4' as const,
  OUTPUT_QUALITY: 85,
  // Prompt enhancements for fixed camera seamless loops
  PROMPT_SUFFIX: 'Camera remains completely still. Cinematic seamless loop. seamless loop. Fixed camera',
  NEGATIVE_PROMPT: 'no dolly, no panning, no zooming'
};
