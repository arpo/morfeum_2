/**
 * Particle Helper Functions
 * Utilities for particle creation, respawning, and boundary wrapping
 */

import type { Particle, ParticleConfig } from './types';

export interface ParticleBounds {
  width: number;
  height: number;
  depth: number;
}

/**
 * Create a single particle with random properties
 */
export function createParticle(
  config: ParticleConfig,
  bounds: ParticleBounds,
  resetY: boolean = false,
  randomAge: boolean = true
): Particle {
  const { size, speed, opacity, lifetime } = config;
  const baseOpacity = opacity.min + Math.random() * (opacity.max - opacity.min);
  const particleLifetime = lifetime
    ? lifetime.min + Math.random() * (lifetime.max - lifetime.min)
    : Infinity;
  // Stagger initial ages so particles don't all respawn at once
  const initialAge = randomAge && lifetime ? Math.random() * particleLifetime : 0;

  return {
    x: (Math.random() - 0.5) * bounds.width,
    y: resetY
      ? bounds.height / 2 + Math.random() * 0.5 // Start above view for falling
      : (Math.random() - 0.5) * bounds.height,
    z: (Math.random() - 0.5) * bounds.depth,
    size: size.min + Math.random() * (size.max - size.min),
    speed: speed.min + Math.random() * (speed.max - speed.min),
    opacity: baseOpacity,
    angle: Math.random() * Math.PI * 2,
    turbulenceOffset: Math.random() * 1000,
    age: initialAge,
    lifetime: particleLifetime,
    baseOpacity: baseOpacity,
  };
}

/**
 * Respawn a particle at a new random position
 */
export function respawnParticle(p: Particle, config: ParticleConfig, bounds: ParticleBounds): void {
  const { size, speed, opacity, lifetime } = config;

  p.x = (Math.random() - 0.5) * bounds.width;
  p.y = (Math.random() - 0.5) * bounds.height;
  p.z = (Math.random() - 0.5) * bounds.depth;
  p.size = size.min + Math.random() * (size.max - size.min);
  p.speed = speed.min + Math.random() * (speed.max - speed.min);
  p.baseOpacity = opacity.min + Math.random() * (opacity.max - opacity.min);
  p.opacity = 0; // Start invisible for fade-in
  p.angle = Math.random() * Math.PI * 2;
  p.turbulenceOffset = Math.random() * 1000;
  p.age = 0;
  p.lifetime = lifetime
    ? lifetime.min + Math.random() * (lifetime.max - lifetime.min)
    : Infinity;
}

/**
 * Wrap particle position to stay in bounds
 */
export function wrapParticle(
  p: Particle,
  bounds: ParticleBounds,
  behavior: ParticleConfig['behavior']
): void {
  const hw = bounds.width / 2;
  const hh = bounds.height / 2;
  const hd = bounds.depth / 2;

  if (p.x > hw) p.x = -hw;
  if (p.x < -hw) p.x = hw;
  if (p.y > hh && behavior !== 'fall') p.y = -hh;
  if (p.y < -hh && behavior !== 'fall') p.y = hh;
  if (p.z > hd) p.z = -hd;
  if (p.z < -hd) p.z = hd;
}

/**
 * Update particle lifetime and opacity
 * Returns true if particle should be respawned
 */
export function updateParticleLifetime(
  p: Particle,
  deltaTime: number,
  config: ParticleConfig
): boolean {
  if (!config.lifetime) return false;

  p.age += deltaTime;

  const fadeIn = config.fadeIn ?? 0;
  const fadeOut = config.fadeOut ?? 0;

  if (p.age < fadeIn) {
    // Fading in
    p.opacity = p.baseOpacity * (p.age / fadeIn);
  } else if (p.age > p.lifetime - fadeOut) {
    // Fading out
    const fadeProgress = Math.max(0, (p.lifetime - p.age) / fadeOut);
    p.opacity = p.baseOpacity * fadeProgress;
  } else {
    // Full visibility
    p.opacity = p.baseOpacity;
  }

  // Return true if dead and needs respawn
  return p.age >= p.lifetime;
}

/**
 * Initialize particle array with random positions
 */
export function initializeParticles(config: ParticleConfig, bounds: ParticleBounds): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < config.count; i++) {
    particles.push(createParticle(config, bounds));
  }
  return particles;
}
