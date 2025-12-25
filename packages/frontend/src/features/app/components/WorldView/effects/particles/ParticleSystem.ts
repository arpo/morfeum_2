/**
 * Particle System
 * Renders floating particles (dust, snow, etc.) using Three.js Points
 * with custom shader for soft circular particles
 */

import * as THREE from 'three';
import type { ParticleConfig, Particle } from './types';
import { getPreset, DUST_PRESET } from './presets';
import { BLEND_MODES, particleVertexShader, particleFragmentShader } from './shaders';

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
  private bounds: { width: number; height: number; depth: number };
  private windGust: WindGust = { active: false, strength: { x: 0, y: 0 }, duration: 0, elapsed: 0 };

  constructor(preset: string = 'dust', depth: number = 2) {
    this.config = getPreset(preset) ?? DUST_PRESET.config;
    this.bounds = { width: 4, height: 3, depth };
    this.initParticles();
  }

  /**
   * Initialize particle array with random positions
   */
  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * Create a single particle with random properties
   */
  private createParticle(resetY: boolean = false, randomAge: boolean = true): Particle {
    const { size, speed, opacity, lifetime } = this.config;
    const baseOpacity = opacity.min + Math.random() * (opacity.max - opacity.min);
    const particleLifetime = lifetime 
      ? lifetime.min + Math.random() * (lifetime.max - lifetime.min)
      : Infinity;
    // Stagger initial ages so particles don't all respawn at once
    const initialAge = randomAge && lifetime
      ? Math.random() * particleLifetime
      : 0;
    
    return {
      x: (Math.random() - 0.5) * this.bounds.width,
      y: resetY 
        ? this.bounds.height / 2 + Math.random() * 0.5  // Start above view for falling
        : (Math.random() - 0.5) * this.bounds.height,
      z: (Math.random() - 0.5) * this.bounds.depth,
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
      switch (this.config.behavior) {
        case 'float':
          this.updateFloatBehavior(p, deltaTime);
          break;
        case 'fall':
          this.updateFallBehavior(p, deltaTime);
          break;
        case 'rise':
          this.updateRiseBehavior(p, deltaTime);
          break;
        case 'flicker':
          this.updateFlickerBehavior(p, deltaTime);
          break;
      }

      // Apply base wind
      p.x += this.config.wind.x * deltaTime;
      p.y += this.config.wind.y * deltaTime;
      
      // Apply wind gust if active
      if (this.windGust.active && gustMultiplier > 0) {
        p.x += this.windGust.strength.x * gustMultiplier * deltaTime;
        p.y += this.windGust.strength.y * gustMultiplier * deltaTime;
      }

      // Wrap around bounds
      this.wrapParticle(p);

      // Handle lifetime and fade in/out
      if (this.config.lifetime) {
        p.age += deltaTime;
        
        const fadeIn = this.config.fadeIn ?? 0;
        const fadeOut = this.config.fadeOut ?? 0;
        
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
        
        // Respawn when dead
        if (p.age >= p.lifetime) {
          this.respawnParticle(p);
        }
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
   * Float behavior - gentle drifting with turbulence (dust, bubbles)
   */
  private updateFloatBehavior(p: Particle, deltaTime: number): void {
    const turbulence = this.config.turbulence;
    const t = this.time + p.turbulenceOffset;
    
    // Perlin-like noise movement scaled by particle speed
    const speedFactor = p.speed * 2;
    p.x += Math.sin(t * 0.5 + p.angle) * turbulence * deltaTime * speedFactor;
    p.y += Math.cos(t * 0.3 + p.angle * 2) * turbulence * deltaTime * 0.5 * speedFactor;
    p.z += Math.sin(t * 0.4 + p.angle * 3) * turbulence * deltaTime * 0.3 * speedFactor;
    
    // Apply drift direction (speed affects how fast it drifts)
    p.x += this.config.drift.x * p.speed * deltaTime;
    p.y += this.config.drift.y * p.speed * deltaTime;
  }

  /**
   * Fall behavior - gravity-affected falling (snow, rain)
   */
  private updateFallBehavior(p: Particle, deltaTime: number): void {
    const turbulence = this.config.turbulence;
    const t = this.time + p.turbulenceOffset;

    // Fall downward
    p.y -= p.speed * deltaTime;

    // Horizontal wobble (snow swaying)
    p.x += Math.sin(t * 2 + p.angle) * turbulence * deltaTime;
    
    // Reset when below view
    if (p.y < -this.bounds.height / 2) {
      p.y = this.bounds.height / 2 + Math.random() * 0.5;
      p.x = (Math.random() - 0.5) * this.bounds.width;
    }
  }

  /**
   * Rise behavior - upward movement (sparks, embers)
   */
  private updateRiseBehavior(p: Particle, deltaTime: number): void {
    const turbulence = this.config.turbulence;
    const t = this.time + p.turbulenceOffset;

    // Rise upward
    p.y += p.speed * deltaTime;

    // Horizontal wobble
    p.x += Math.sin(t * 3 + p.angle) * turbulence * deltaTime;

    // Reset when above view
    if (p.y > this.bounds.height / 2) {
      p.y = -this.bounds.height / 2;
      p.x = (Math.random() - 0.5) * this.bounds.width;
    }
  }

  /**
   * Flicker behavior - appear/disappear with glow (fireflies)
   */
  private updateFlickerBehavior(p: Particle, deltaTime: number): void {
    const turbulence = this.config.turbulence;
    const t = this.time + p.turbulenceOffset;

    // Slow random movement - speed affects movement rate
    const speedFactor = p.speed * 5;
    p.x += Math.sin(t * 0.2 + p.angle) * turbulence * deltaTime * speedFactor;
    p.y += Math.cos(t * 0.15 + p.angle * 2) * turbulence * deltaTime * speedFactor * 0.6;
    
    // Update opacity for flickering effect
    p.opacity = this.config.opacity.min + 
      (Math.sin(t * 3) * 0.5 + 0.5) * (this.config.opacity.max - this.config.opacity.min);
  }

  /**
   * Respawn a particle at a new random position
   */
  private respawnParticle(p: Particle): void {
    const { size, speed, opacity, lifetime } = this.config;
    
    p.x = (Math.random() - 0.5) * this.bounds.width;
    p.y = (Math.random() - 0.5) * this.bounds.height;
    p.z = (Math.random() - 0.5) * this.bounds.depth;
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
  private wrapParticle(p: Particle): void {
    const hw = this.bounds.width / 2;
    const hh = this.bounds.height / 2;
    const hd = this.bounds.depth / 2;

    if (p.x > hw) p.x = -hw;
    if (p.x < -hw) p.x = hw;
    if (p.y > hh && this.config.behavior !== 'fall') p.y = -hh;
    if (p.y < -hh && this.config.behavior !== 'fall') p.y = hh;
    if (p.z > hd) p.z = -hd;
    if (p.z < -hd) p.z = hd;
  }

  /**
   * Change particle preset
   */
  setPreset(preset: string): void {
    const newConfig = getPreset(preset);
    if (newConfig) {
      this.config = newConfig;
      this.initParticles();
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
