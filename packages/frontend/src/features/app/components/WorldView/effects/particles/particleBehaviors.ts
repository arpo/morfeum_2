/**
 * Particle Behavior Functions
 * Pure functions that update particle movement based on behavior type
 */

import type { Particle, ParticleConfig } from './types';

/**
 * Float behavior - gentle drifting with turbulence (dust, bubbles)
 */
export function updateFloatBehavior(
  p: Particle,
  deltaTime: number,
  time: number,
  config: ParticleConfig
): void {
  const turbulence = config.turbulence;
  const t = time + p.turbulenceOffset;

  // Perlin-like noise movement scaled by particle speed
  const speedFactor = p.speed * 2;
  p.x += Math.sin(t * 0.5 + p.angle) * turbulence * deltaTime * speedFactor;
  p.y += Math.cos(t * 0.3 + p.angle * 2) * turbulence * deltaTime * 0.5 * speedFactor;
  p.z += Math.sin(t * 0.4 + p.angle * 3) * turbulence * deltaTime * 0.3 * speedFactor;

  // Apply drift direction (speed affects how fast it drifts)
  p.x += config.drift.x * p.speed * deltaTime;
  p.y += config.drift.y * p.speed * deltaTime;
}

/**
 * Fall behavior - gravity-affected falling (snow, rain)
 */
export function updateFallBehavior(
  p: Particle,
  deltaTime: number,
  time: number,
  config: ParticleConfig,
  boundsHeight: number
): void {
  const turbulence = config.turbulence;
  const t = time + p.turbulenceOffset;

  // Fall downward
  p.y -= p.speed * deltaTime;

  // Horizontal wobble (snow swaying)
  p.x += Math.sin(t * 2 + p.angle) * turbulence * deltaTime;

  // Reset when below view
  if (p.y < -boundsHeight / 2) {
    p.y = boundsHeight / 2 + Math.random() * 0.5;
    p.x = (Math.random() - 0.5) * boundsHeight;
  }
}

/**
 * Rise behavior - upward movement (sparks, embers)
 */
export function updateRiseBehavior(
  p: Particle,
  deltaTime: number,
  time: number,
  config: ParticleConfig,
  boundsHeight: number,
  boundsWidth: number
): void {
  const turbulence = config.turbulence;
  const t = time + p.turbulenceOffset;

  // Rise upward
  p.y += p.speed * deltaTime;

  // Horizontal wobble
  p.x += Math.sin(t * 3 + p.angle) * turbulence * deltaTime;

  // Reset when above view
  if (p.y > boundsHeight / 2) {
    p.y = -boundsHeight / 2;
    p.x = (Math.random() - 0.5) * boundsWidth;
  }
}

/**
 * Flicker behavior - appear/disappear with glow (fireflies)
 */
export function updateFlickerBehavior(
  p: Particle,
  deltaTime: number,
  time: number,
  config: ParticleConfig
): void {
  const turbulence = config.turbulence;
  const t = time + p.turbulenceOffset;

  // Slow random movement - speed affects movement rate
  const speedFactor = p.speed * 5;
  p.x += Math.sin(t * 0.2 + p.angle) * turbulence * deltaTime * speedFactor;
  p.y += Math.cos(t * 0.15 + p.angle * 2) * turbulence * deltaTime * speedFactor * 0.6;

  // Update opacity for flickering effect
  p.opacity =
    config.opacity.min +
    (Math.sin(t * 3) * 0.5 + 0.5) * (config.opacity.max - config.opacity.min);
}

/**
 * Apply behavior-specific movement to a particle
 */
export function applyBehavior(
  p: Particle,
  deltaTime: number,
  time: number,
  config: ParticleConfig,
  bounds: { width: number; height: number; depth: number }
): void {
  switch (config.behavior) {
    case 'float':
      updateFloatBehavior(p, deltaTime, time, config);
      break;
    case 'fall':
      updateFallBehavior(p, deltaTime, time, config, bounds.height);
      break;
    case 'rise':
      updateRiseBehavior(p, deltaTime, time, config, bounds.height, bounds.width);
      break;
    case 'flicker':
      updateFlickerBehavior(p, deltaTime, time, config);
      break;
  }
}
