/**
 * Particle System Types
 */

export type ParticleBehavior = 'float' | 'fall' | 'rise' | 'flicker';
export type ParticleBlendMode = 'normal' | 'additive' | 'multiply';

export interface ParticleConfig {
  enabled: boolean;
  count: number;
  size: { min: number; max: number };
  speed: { min: number; max: number };
  opacity: { min: number; max: number };
  color: string;
  behavior: ParticleBehavior;
  blendMode: ParticleBlendMode;  // How particles blend with background (normal, additive, multiply)
  wind: { x: number; y: number };
  drift: { x: number; y: number };  // Direction particles drift (y: positive=up, negative=down)
  turbulence: number;
  depthAware: boolean;
  lifetime?: { min: number; max: number };  // Particle lifetime in seconds before respawn
  fadeIn?: number;   // Fade-in duration in seconds
  fadeOut?: number;  // Fade-out duration in seconds
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  opacity: number;
  angle: number;
  turbulenceOffset: number;
  age: number;         // Current age in seconds
  lifetime: number;    // Max lifetime before respawn
  baseOpacity: number; // Original opacity (for fade calculations)
}

export interface ParticlePreset {
  name: string;
  config: ParticleConfig;
}
