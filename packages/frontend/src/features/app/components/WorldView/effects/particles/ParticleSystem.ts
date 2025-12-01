/**
 * Particle System
 * Renders floating particles (dust, snow, etc.) using Three.js Points
 * with custom shader for soft circular particles
 */

import * as THREE from 'three';
import type { ParticleConfig, Particle, ParticleBlendMode } from './types';
import { getPreset, DUST_PRESET } from './presets';

// Map blend mode string to Three.js blending constant
const BLEND_MODES: Record<ParticleBlendMode, THREE.Blending> = {
  normal: THREE.NormalBlending,
  additive: THREE.AdditiveBlending,
  multiply: THREE.MultiplyBlending,
};

// Vertex shader - passes size and opacity to fragment shader
const vertexShader = `
  attribute float size;
  attribute float opacity;
  varying float vOpacity;
  
  void main() {
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader - creates soft circular particles with fading edges
const fragmentShader = `
  uniform vec3 color;
  varying float vOpacity;
  
  void main() {
    // Calculate distance from center (gl_PointCoord is 0-1 for the point)
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    // Discard pixels outside the circle
    if (dist > 0.5) discard;
    
    // Soft edge falloff - smoothstep creates gradient from center to edge
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Apply particle opacity
    gl_FragColor = vec4(color, alpha * vOpacity);
  }
`;

export class ParticleSystem {
  private particles: Particle[] = [];
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private config: ParticleConfig;
  private time: number = 0;
  private bounds: { width: number; height: number; depth: number };

  constructor(preset: string = 'dust') {
    this.config = getPreset(preset) ?? DUST_PRESET.config;
    this.bounds = { width: 4, height: 3, depth: 2 };
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
  private createParticle(resetY: boolean = false): Particle {
    const { size, speed, opacity } = this.config;
    return {
      x: (Math.random() - 0.5) * this.bounds.width,
      y: resetY 
        ? this.bounds.height / 2 + Math.random() * 0.5  // Start above view for falling
        : (Math.random() - 0.5) * this.bounds.height,
      z: (Math.random() - 0.5) * this.bounds.depth,
      size: size.min + Math.random() * (size.max - size.min),
      speed: speed.min + Math.random() * (speed.max - speed.min),
      opacity: opacity.min + Math.random() * (opacity.max - opacity.min),
      angle: Math.random() * Math.PI * 2,
      turbulenceOffset: Math.random() * 1000,
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
      vertexShader,
      fragmentShader,
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

      // Apply wind
      p.x += this.config.wind.x * deltaTime;
      p.y += this.config.wind.y * deltaTime;

      // Wrap around bounds
      this.wrapParticle(p);

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
