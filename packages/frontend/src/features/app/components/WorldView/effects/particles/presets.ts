/**
 * Particle Presets
 * Pre-configured particle settings for common effects
 */

import type { ParticleConfig, ParticlePreset } from './types';

/**
 * Dust particles - gentle floating motes in the air
 */
export const DUST_PRESET: ParticlePreset = {
  name: 'dust',
  config: {
    enabled: true,
    count: 500,
    size: { min: 0.025, max: 0.1  },  // Small dust motes
    speed: { min: 0.05, max: 0.15 },
    opacity: { min: 0.15, max: 0.4 },
    color: '#ffffff',
    behavior: 'float',
    blendMode: 'additive',  // Normal blending for natural look
    wind: { x: 0.02, y: -0.01 },
    drift: { x: 0, y: 0 },  // No drift - just turbulence
    turbulence: 0.3,
    depthAware: true,
  }
};

/**
 * Snow particles - falling snowflakes
 */
export const SNOW_PRESET: ParticlePreset = {
  name: 'snow',
  config: {
    enabled: true,
    count: 80,
    size: { min: 0.5, max: 1.5 },  // Small to medium snowflakes
    speed: { min: 0.3, max: 0.8 },
    opacity: { min: 0.5, max: 0.9 },
    color: '#ffffff',
    behavior: 'fall',
    blendMode: 'normal',  // Normal blending for natural look
    wind: { x: 0.1, y: 0 },
    drift: { x: 0, y: 0 },  // Fall behavior handles vertical movement
    turbulence: 0.4,
    depthAware: true,
  }
};

/**
 * Rain particles - falling raindrops (for future)
 */
export const RAIN_PRESET: ParticlePreset = {
  name: 'rain',
  config: {
    enabled: true,
    count: 150,
    size: { min: 0.2, max: 0.5 },  // Thin rain streaks
    speed: { min: 2, max: 4 },
    opacity: { min: 0.3, max: 0.6 },
    color: '#a0c0ff',
    behavior: 'fall',
    blendMode: 'normal',  // Normal blending for natural look
    wind: { x: 0.3, y: 0 },
    drift: { x: 0, y: 0 },  // Fall behavior handles vertical movement
    turbulence: 0.1,
    depthAware: false,
  }
};
/**
 * Fireflies - glowing flickering particles
 */
export const FIREFLIES_PRESET: ParticlePreset = {
  name: 'fireflies',
  config: {
    enabled: true,
    count: 15,
    size: { min: 0.8, max: 1.5 },  // Small glowing dots
    speed: { min: 0.02, max: 0.08 },
    opacity: { min: 0.3, max: 1 },
    color: '#ffff80',
    behavior: 'flicker',
    blendMode: 'additive',  // Additive for glowing effect
    wind: { x: 0, y: 0 },
    drift: { x: 0, y: 0 },  // No drift - random movement only
    turbulence: 0.5,
    depthAware: true,
  }
};

/**
 * Embers - rising orange/red glowing particles
 */
export const EMBERS_PRESET: ParticlePreset = {
  name: 'embers',
  config: {
    enabled: true,
    count: 30,
    size: { min: 0.3, max: 0.8 },
    speed: { min: 0.15, max: 0.4 },
    opacity: { min: 0.4, max: 0.9 },
    color: '#ff6600',
    behavior: 'rise',
    blendMode: 'additive',  // Glowing effect
    wind: { x: 0.05, y: 0 },
    drift: { x: 0.1, y: 0 },  // Slight horizontal drift
    turbulence: 0.6,
    depthAware: true,
  }
};

/**
 * Fog/Mist - large slow-moving atmospheric particles
 */
export const FOG_PRESET: ParticlePreset = {
  name: 'fog',
  config: {
    enabled: true,
    count: 20,
    size: { min: 3, max: 8 },  // Large soft particles
    speed: { min: 0.02, max: 0.06 },
    opacity: { min: 0.05, max: 0.15 },  // Very transparent
    color: '#ffffff',
    behavior: 'float',
    blendMode: 'normal',
    wind: { x: 0.03, y: 0 },
    drift: { x: 0.05, y: 0 },  // Slow horizontal drift
    turbulence: 0.1,
    depthAware: false,
  }
};

/**
 * Bubbles - underwater rising bubbles
 */
export const BUBBLES_PRESET: ParticlePreset = {
  name: 'bubbles',
  config: {
    enabled: true,
    count: 40,
    size: { min: 0.2, max: 0.8 },
    speed: { min: 0.2, max: 0.5 },
    opacity: { min: 0.3, max: 0.6 },
    color: '#80d0ff',
    behavior: 'rise',
    blendMode: 'normal',
    wind: { x: 0, y: 0 },
    drift: { x: 0, y: 0 },
    turbulence: 0.5,  // Wobble as they rise
    depthAware: true,
  }
};

/**
 * Sparks - fast rising bright particles
 */
export const SPARKS_PRESET: ParticlePreset = {
  name: 'sparks',
  config: {
    enabled: true,
    count: 50,
    size: { min: 0.15, max: 0.4 },
    speed: { min: 0.8, max: 1.5 },  // Fast rising
    opacity: { min: 0.6, max: 1.0 },
    color: '#ffcc00',
    behavior: 'rise',
    blendMode: 'additive',
    wind: { x: 0.1, y: 0 },
    drift: { x: 0.2, y: 0 },
    turbulence: 0.8,  // Erratic movement
    depthAware: true,
  }
};

/**
 * Stars - stationary twinkling points
 */
export const STARS_PRESET: ParticlePreset = {
  name: 'stars',
  config: {
    enabled: true,
    count: 60,
    size: { min: 0.2, max: 0.6 },
    speed: { min: 0.01, max: 0.03 },  // Very slow
    opacity: { min: 0.3, max: 1.0 },
    color: '#ffffff',
    behavior: 'flicker',
    blendMode: 'additive',
    wind: { x: 0, y: 0 },
    drift: { x: 0, y: 0 },
    turbulence: 0.05,  // Almost stationary
    depthAware: false,
  }
};

/**
 * Ash - slow falling dark particles
 */
export const ASH_PRESET: ParticlePreset = {
  name: 'ash',
  config: {
    enabled: true,
    count: 60,
    size: { min: 0.2, max: 0.5 },
    speed: { min: 0.1, max: 0.25 },
    opacity: { min: 0.3, max: 0.6 },
    color: '#404040',
    behavior: 'fall',
    blendMode: 'normal',
    wind: { x: 0.05, y: 0 },
    drift: { x: 0, y: 0 },
    turbulence: 0.4,
    depthAware: true,
  }
};

/**
 * Pollen - yellow floating particles
 */
export const POLLEN_PRESET: ParticlePreset = {
  name: 'pollen',
  config: {
    enabled: true,
    count: 35,
    size: { min: 0.1, max: 0.3 },
    speed: { min: 0.03, max: 0.08 },
    opacity: { min: 0.4, max: 0.7 },
    color: '#ffee88',
    behavior: 'float',
    blendMode: 'normal',
    wind: { x: 0.04, y: 0.01 },
    drift: { x: 0.05, y: 0.02 },  // Gentle upward drift
    turbulence: 0.35,
    depthAware: true,
  }
};

/**
 * Get preset by name
 */
export function getPreset(name: string): ParticleConfig | null {
  const presets: Record<string, ParticlePreset> = {
    dust: DUST_PRESET,
    snow: SNOW_PRESET,
    rain: RAIN_PRESET,
    fireflies: FIREFLIES_PRESET,
    embers: EMBERS_PRESET,
    fog: FOG_PRESET,
    bubbles: BUBBLES_PRESET,
    sparks: SPARKS_PRESET,
    stars: STARS_PRESET,
    ash: ASH_PRESET,
    pollen: POLLEN_PRESET,
  };
  return presets[name]?.config ?? null;
}

/**
 * All available presets
 */
export const PARTICLE_PRESETS = {
  dust: DUST_PRESET,
  snow: SNOW_PRESET,
  rain: RAIN_PRESET,
  fireflies: FIREFLIES_PRESET,
  embers: EMBERS_PRESET,
  fog: FOG_PRESET,
  bubbles: BUBBLES_PRESET,
  sparks: SPARKS_PRESET,
  stars: STARS_PRESET,
  ash: ASH_PRESET,
  pollen: POLLEN_PRESET,
} as const;

export type ParticlePresetName = keyof typeof PARTICLE_PRESETS;
