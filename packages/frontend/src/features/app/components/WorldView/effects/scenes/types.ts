/**
 * Scene Preset Types
 * Combines particle and post-processor settings into themed scenes
 */

import type { ColorEffects } from '../postprocessors';

/**
 * Scene preset configuration
 */
export interface ScenePresetConfig {
  name: string;
  description: string;
  
  // Particle settings
  particles: {
    preset: string;  // Particle preset name
    enabled: boolean;
  };
  
  // Post-processor displacement effect
  displacement: {
    preset: string;  // 'heatwave' | 'underwater' | 'glitch' | 'dream' | 'none'
    enabled: boolean;
    intensity?: number;  // Override preset intensity
  };
  
  // Color effects (layered on top)
  colorEffects: Partial<ColorEffects>;
  
  // Optional wind gust settings for storms, etc.
  windGust?: {
    enabled: boolean;
    interval: number;   // Seconds between gusts
    strengthX: number;
    strengthY: number;
    duration: number;
  };
  
  // Optional lightning settings
  lightning?: {
    enabled: boolean;
    interval: number;  // Average seconds between flashes
    intensity: number;
  };
}

export interface ScenePreset {
  name: string;
  config: ScenePresetConfig;
}
