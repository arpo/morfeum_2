/**
 * Particle System Types
 */

export type ParticleBehavior = 'float' | 'fall' | 'rise' | 'flicker';

export interface ParticleConfig {
  enabled: boolean;
  count: number;
  size: { min: number; max: number };
  speed: { min: number; max: number };
  opacity: { min: number; max: number };
  color: string;
  behavior: ParticleBehavior;
  wind: { x: number; y: number };
  turbulence: number;
  depthAware: boolean;
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
}

export interface ParticlePreset {
  name: string;
  config: ParticleConfig;
}
