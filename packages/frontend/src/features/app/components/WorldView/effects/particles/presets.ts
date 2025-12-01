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
    count: 40,
    size: { min: 0.3, max: 0.8 },  // Small dust motes
    speed: { min: 0.05, max: 0.15 },
    opacity: { min: 0.15, max: 0.4 },
    color: '#ffffff',
    behavior: 'float',
    wind: { x: 0.02, y: -0.01 },
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
    wind: { x: 0.1, y: 0 },
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
    wind: { x: 0.3, y: 0 },
    turbulence: 0.1,
    depthAware: false,
  }
};

/**
 * Fireflies - glowing flickering particles (for future)
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
    wind: { x: 0, y: 0 },
    turbulence: 0.5,
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
} as const;

export type ParticlePresetName = keyof typeof PARTICLE_PRESETS;
