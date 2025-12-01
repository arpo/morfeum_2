/**
 * Post-Processor Presets
 * Pre-configured settings for image displacement effects
 */

import type { PostProcessorConfig, PostProcessorPreset } from './types';

/**
 * Heat Wave - Rising shimmer effect like heat from hot surface
 */
export const HEATWAVE_PRESET: PostProcessorPreset = {
  name: 'heatwave',
  config: {
    enabled: false,
    type: 'heatwave',
    intensity: 0.25,
    speed: 1.0,
    frequency: 3.0,
    direction: { x: 1.0, y: 1.0 },
  }
};

/**
 * Underwater - Wavy refraction like looking through water
 */
export const UNDERWATER_PRESET: PostProcessorPreset = {
  name: 'underwater',
  config: {
    enabled: false,
    type: 'underwater',
    intensity: 0.4,
    speed: 0.8,
    frequency: 2.0,
    direction: { x: 1.0, y: 1.0 },
  }
};

/**
 * Glitch - Digital corruption effect
 */
export const GLITCH_PRESET: PostProcessorPreset = {
  name: 'glitch',
  config: {
    enabled: false,
    type: 'glitch',
    intensity: 0.6,
    speed: 1.5,
    frequency: 1.0,
    direction: { x: 1.0, y: 0.0 },
  }
};

/**
 * Dream - Soft pulsing distortion
 */
export const DREAM_PRESET: PostProcessorPreset = {
  name: 'dream',
  config: {
    enabled: false,
    type: 'dream',
    intensity: 0.3,
    speed: 0.5,
    frequency: 2.5,
    direction: { x: 1.0, y: 1.0 },
  }
};

/**
 * Get preset by name
 */
export function getPostProcessorPreset(name: string): PostProcessorConfig | null {
  const presets: Record<string, PostProcessorPreset> = {
    heatwave: HEATWAVE_PRESET,
    underwater: UNDERWATER_PRESET,
    glitch: GLITCH_PRESET,
    dream: DREAM_PRESET,
  };
  return presets[name]?.config ?? null;
}

/**
 * All available presets
 */
export const POSTPROCESSOR_PRESETS = {
  heatwave: HEATWAVE_PRESET,
  underwater: UNDERWATER_PRESET,
  glitch: GLITCH_PRESET,
  dream: DREAM_PRESET,
} as const;

export type PostProcessorPresetName = keyof typeof POSTPROCESSOR_PRESETS;
