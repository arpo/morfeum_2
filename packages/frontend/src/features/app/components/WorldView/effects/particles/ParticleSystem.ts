/**
 * Particle System
 * Renders floating particles (dust, snow, etc.) using Three.js Points
 * with custom shader for soft circular particles
 */

import * as THREE from 'three';
import type { ParticleConfig, Particle } from './types';
import { getPreset, DUST_PRESET } from './presets';
import { BLEND_MODES, particleVertexShader, particleFragmentShader } from './shaders';
import { applyBehavior } from './particleBehaviors';
import {
  createParticle,
  respawnParticle,
  wrapParticle,
  updateParticleLifetime,
  initializeParticles,
  type ParticleBounds,
} from './particleHelpers';

// Wind gust configuration
interface WindGust {
  active: boolean;
  strength: { x: number; y: number };
  duration: number;
  elapsed: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private config: ParticleConfig;
  private time: number = 0;
  private bounds: ParticleBounds;
  private windGust: WindGust = { active: false, strength: { x: 0, y: 0 }, duration: 0, elapsed: 0 };

  constructor(preset: string = 'dust', depth: number = 2) {
    this.config = getPreset(preset) ?? DUST_PRESET.config;
    this.bounds = { width: 4, height: 3, depth };
    this.particles = initializeParticles(this.config, this.bounds);
  }

  /**
   * Create Three.js objects for rendering
   */
  createMesh(scene: THREE.Scene): THREE.Points {
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.config.count * 3);
    const sizes = new Float32Array(this.config.count);
    const opacities = new Float32Array(this.config.count);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      sizes[i] = p.size;
      opacities[i] = p.opacity;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // Create custom shader material for soft circular particles
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(this.config.color) },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: BLEND_MODES[this.config.blendMode] ?? THREE.NormalBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.renderOrder = 999; // Render on top
    scene.add(this.points);

    return this.points;
  }

  /**
   * Update particle positions based on behavior
   */
  update(deltaTime: number): void {
    if (!this.geometry || !this.config.enabled) return;

    this.time += deltaTime;

    // Update wind gust
    let gustMultiplier = 0;
    if (this.windGust.active) {
      this.windGust.elapsed += deltaTime;
      if (this.windGust.elapsed >= this.windGust.duration) {
        this.windGust.active = false;
        this.windGust.elapsed = 0;
      } else {
        // Smooth ease-in-out for gust strength
        const progress = this.windGust.elapsed / this.windGust.duration;
        gustMultiplier = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
      }
    }

    const positions = this.geometry.attributes.position.array as Float32Array;
    const opacities = this.geometry.attributes.opacity.array as Float32Array;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Apply behavior-specific movement
      applyBehavior(p, deltaTime, this.time, this.config, this.bounds);

      // Apply base wind
      p.x += this.config.wind.x * deltaTime;
      p.y += this.config.wind.y * deltaTime;

      // Apply wind gust if active
      if (this.windGust.active && gustMultiplier > 0) {
        p.x += this.windGust.strength.x * gustMultiplier * deltaTime;
        p.y += this.windGust.strength.y * gustMultiplier * deltaTime;
      }

      // Wrap around bounds
      wrapParticle(p, this.bounds, this.config.behavior);

      // Handle lifetime and fade in/out
      const shouldRespawn = updateParticleLifetime(p, deltaTime, this.config);
      if (shouldRespawn) {
        respawnParticle(p, this.config, this.bounds);
      }

      // Update buffers
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      opacities[i] = p.opacity;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;
  }

  /**
   * Change particle preset
   */
  setPreset(preset: string): void {
    const newConfig = getPreset(preset);
    if (newConfig) {
      this.config = newConfig;
      this.particles = initializeParticles(this.config, this.bounds);
      this.updateGeometry();
    }
  }

  /**
   * Update geometry buffer with new particle count
   */
  private updateGeometry(): void {
    if (!this.geometry) return;

    const positions = new Float32Array(this.config.count * 3);
    const sizes = new Float32Array(this.config.count);
    const opacities = new Float32Array(this.config.count);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      sizes[i] = p.size;
      opacities[i] = p.opacity;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    if (this.material) {
      this.material.uniforms.color.value.set(this.config.color);
      this.material.blending = BLEND_MODES[this.config.blendMode] ?? THREE.NormalBlending;
    }
  }

  /**
   * Enable/disable particle system
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (this.points) {
      this.points.visible = enabled;
    }
  }

  /**
   * Update bounds based on scene size
   */
  setBounds(width: number, height: number, depth: number = 2): void {
    this.bounds = { width, height, depth };
  }

  /**
   * Trigger a wind gust
   * @param strengthX - Horizontal gust strength (negative = left, positive = right)
   * @param strengthY - Vertical gust strength (negative = down, positive = up)
   * @param duration - How long the gust lasts in seconds
   */
  triggerWindGust(strengthX: number = 2, strengthY: number = 0, duration: number = 1.5): void {
    this.windGust = {
      active: true,
      strength: { x: strengthX, y: strengthY },
      duration,
      elapsed: 0,
    };
  }

  /**
   * Check if a wind gust is currently active
   */
  isWindGustActive(): boolean {
    return this.windGust.active;
  }

  /**
   * Clean up resources
   */
  dispose(scene: THREE.Scene): void {
    if (this.points) {
      scene.remove(this.points);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    this.points = null;
    this.geometry = null;
    this.material = null;
  }
}
