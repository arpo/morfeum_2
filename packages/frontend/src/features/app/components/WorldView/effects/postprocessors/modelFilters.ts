/**
 * Model Filter Presets
 * Color correction presets for different AI image generation models
 * to ensure visual consistency across different model outputs
 */

import type { ModelFilters } from './PostProcessorSystem';

/**
 * Model filter configurations
 * Maps model class names (e.g., 'model-a', 'model-b') to filter presets
 */
export const MODEL_FILTER_PRESETS: Record<string, ModelFilters> = {
  // Model A (flux) - Reference model, no correction needed
  'model-a': {
    saturation: 1.0,
    contrast: 1.0,
    brightness: 1.0,
    gamma: 1.0,
  },

  // Model B (fal-flux-2-turbo-edit) - Needs enhancement to match Model A
  // CSS equivalent: saturate(1.2) contrast(1.2) brightness(0.9)
  'model-b': {
    saturation: 1.2,   // Increase color intensity
    contrast: 1.2,     // Increase contrast
    brightness: 0.9,   // Slightly darker
    gamma: 1.0,        // No gamma adjustment
  },

  // Add more models as needed:
  // 'model-c': { ... },
  // 'model-d': { ... },
};

/**
 * Get model filter preset by model class name
 * Returns undefined if no preset exists (no filtering needed)
 */
export function getModelFilterPreset(modelClass: string | null | undefined): ModelFilters | undefined {
  if (!modelClass) return undefined;
  return MODEL_FILTER_PRESETS[modelClass];
}

/**
 * Check if model requires filtering
 */
export function modelRequiresFiltering(modelClass: string | null | undefined): boolean {
  if (!modelClass) return false;
  const preset = MODEL_FILTER_PRESETS[modelClass];
  if (!preset) return false;
  
  // Check if any filter deviates from default (1.0)
  return preset.saturation !== 1.0 ||
         preset.contrast !== 1.0 ||
         preset.brightness !== 1.0 ||
         preset.gamma !== 1.0;
}
