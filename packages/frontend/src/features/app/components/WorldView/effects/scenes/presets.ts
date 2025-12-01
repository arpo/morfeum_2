/**
 * Scene Presets
 * Pre-configured combinations of particles and post-processor effects
 */

import type { ScenePreset, ScenePresetConfig } from './types';

/**
 * Sunset scene - warm golden hour atmosphere
 */
export const SUNSET_PRESET: ScenePreset = {
  name: 'sunset',
  config: {
    name: 'Sunset',
    description: 'Warm golden hour with floating pollen and soft bloom',
    particles: {
      preset: 'pollen',
      enabled: true,
    },
    displacement: {
      preset: 'heatwave',
      enabled: true,
      intensity: 0.3,
    },
    colorEffects: {
      tint: { r: 1.2, g: 0.9, b: 0.7 },  // Warm orange tint
      tintStrength: 0.4,
      bloom: 0.4,
      vignette: 0.2,
    },
  },
};

/**
 * Storm scene - rain with lightning and dark atmosphere
 */
export const STORM_PRESET: ScenePreset = {
  name: 'storm',
  config: {
    name: 'Storm',
    description: 'Heavy rain with lightning flashes and strong wind',
    particles: {
      preset: 'rain',
      enabled: true,
    },
    displacement: {
      preset: 'none',
      enabled: false,
    },
    colorEffects: {
      tint: { r: 0.7, g: 0.75, b: 0.9 },  // Cold blue-gray
      tintStrength: 0.5,
      vignette: 0.6,
      desaturate: 0.3,
    },
    windGust: {
      enabled: true,
      interval: 4,      // Gust every 4 seconds on average
      strengthX: 3,
      strengthY: -0.5,
      duration: 2,
    },
    lightning: {
      enabled: true,
      interval: 5,      // Flash every 5 seconds on average
      intensity: 0.8,
    },
  },
};

/**
 * Underwater scene - bubbles with wavy distortion and blue tint
 */
export const UNDERWATER_PRESET: ScenePreset = {
  name: 'underwater',
  config: {
    name: 'Underwater',
    description: 'Submerged view with bubbles and light refraction',
    particles: {
      preset: 'bubbles',
      enabled: true,
    },
    displacement: {
      preset: 'underwater',
      enabled: true,
      intensity: 0.5,
    },
    colorEffects: {
      tint: { r: 0.6, g: 0.85, b: 1.1 },  // Cyan/blue
      tintStrength: 0.5,
      vignette: 0.3,
    },
  },
};

/**
 * Haunted scene - eerie fog with desaturated look
 */
export const HAUNTED_PRESET: ScenePreset = {
  name: 'haunted',
  config: {
    name: 'Haunted',
    description: 'Eerie atmosphere with fog and muted colors',
    particles: {
      preset: 'fog',
      enabled: true,
    },
    displacement: {
      preset: 'dream',
      enabled: true,
      intensity: 0.2,
    },
    colorEffects: {
      tint: { r: 0.8, g: 0.85, b: 0.9 },  // Slight cold tint
      tintStrength: 0.3,
      vignette: 0.7,
      desaturate: 0.6,
    },
  },
};

/**
 * Magical forest scene - fireflies with dreamy glow
 */
export const MAGICAL_PRESET: ScenePreset = {
  name: 'magical',
  config: {
    name: 'Magical Forest',
    description: 'Enchanted atmosphere with fireflies and soft glow',
    particles: {
      preset: 'fireflies',
      enabled: true,
    },
    displacement: {
      preset: 'dream',
      enabled: true,
      intensity: 0.3,
    },
    colorEffects: {
      tint: { r: 0.9, g: 1.0, b: 0.85 },  // Slight green/yellow
      tintStrength: 0.2,
      bloom: 0.5,
      vignette: 0.3,
    },
  },
};

/**
 * All scene presets
 */
export const SCENE_PRESETS: Record<string, ScenePreset> = {
  sunset: SUNSET_PRESET,
  storm: STORM_PRESET,
  underwater: UNDERWATER_PRESET,
  haunted: HAUNTED_PRESET,
  magical: MAGICAL_PRESET,
};

/**
 * Get a scene preset by name
 */
export function getScenePreset(name: string): ScenePresetConfig | null {
  const preset = SCENE_PRESETS[name.toLowerCase()];
  return preset?.config ?? null;
}

/**
 * List of available scene preset names
 */
export type ScenePresetName = keyof typeof SCENE_PRESETS;
