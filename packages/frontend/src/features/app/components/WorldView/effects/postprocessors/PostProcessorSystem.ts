/**
 * Post-Processor System
 * Applies image displacement and color effects (heat wave, underwater, bloom, vignette, etc.)
 */

import * as THREE from 'three';
import type { PostProcessorConfig } from './types';
import { getPostProcessorPreset, HEATWAVE_PRESET } from '.';


// Vertex shader - simple pass-through
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader - displacement + color effects
const fragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float time;
  uniform float intensity;
  uniform float frequency;
  uniform vec2 direction;
  uniform int effectType;  // 0=heatwave, 1=underwater, 2=glitch, 3=dream
  
  // Color effects uniforms
  uniform float vignette;      // 0-1 vignette strength
  uniform vec3 tint;           // RGB tint color (1,1,1 = no tint)
  uniform float tintStrength;  // 0-1 tint blend
  uniform float bloom;         // 0-1 bloom strength
  uniform float lightning;     // 0-1 lightning flash
  uniform float desaturate;    // 0-1 desaturation amount
  
  varying vec2 vUv;
  
  // Simplex noise for organic distortion
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  // Heat wave effect - rising shimmer
  vec2 heatWaveDisplacement(vec2 uv) {
    float noise1 = snoise(vec2(uv.x * frequency * 2.0, uv.y * frequency - time * 0.5));
    float noise2 = snoise(vec2(uv.x * frequency * 3.0 + 100.0, uv.y * frequency * 0.5 - time * 0.3));
    
    // Stronger at bottom, weaker at top (heat rises)
    float heightFactor = 1.0 - uv.y;
    
    vec2 displacement;
    displacement.x = noise1 * intensity * 0.02 * heightFactor;
    displacement.y = noise2 * intensity * 0.01 * heightFactor;
    
    return displacement;
  }
  
  // Underwater effect - wavy refraction
  vec2 underwaterDisplacement(vec2 uv) {
    float wave1 = sin(uv.x * frequency * 10.0 + time) * cos(uv.y * frequency * 8.0 + time * 0.7);
    float wave2 = sin(uv.y * frequency * 12.0 - time * 0.8) * cos(uv.x * frequency * 6.0 + time * 0.5);
    float noise = snoise(vec2(uv.x * frequency + time * 0.2, uv.y * frequency + time * 0.15));
    
    vec2 displacement;
    displacement.x = (wave1 + noise * 0.5) * intensity * 0.015;
    displacement.y = (wave2 + noise * 0.3) * intensity * 0.015;
    
    return displacement;
  }
  
  // Glitch effect - digital corruption with scan lines
  vec2 glitchDisplacement(vec2 uv) {
    // Create horizontal glitch bands
    float bandNoise = snoise(vec2(floor(time * 8.0), floor(uv.y * 15.0)));
    float glitchBand = step(0.6, abs(bandNoise));  // More frequent bands
    
    // Random horizontal offset per band
    float offset = snoise(vec2(floor(time * 15.0), floor(uv.y * 10.0)));
    
    // Add occasional strong glitches
    float strongGlitch = step(0.85, snoise(vec2(time * 5.0, 0.0))) * 2.0;
    
    // Chromatic aberration-like split
    float split = sin(uv.y * 50.0 + time * 10.0) * 0.3;
    
    vec2 displacement;
    displacement.x = (offset * glitchBand + split * glitchBand * 0.5 + strongGlitch * offset) * intensity * 0.08;
    displacement.y = glitchBand * snoise(vec2(time * 12.0, uv.x * 20.0)) * intensity * 0.02;
    
    return displacement;
  }
  
  // Dream effect - soft wavy distortion with breathing
  vec2 dreamDisplacement(vec2 uv) {
    // Slow breathing pulse
    float pulse = sin(time * 0.8) * 0.5 + 0.5;
    float pulse2 = sin(time * 0.5 + 1.5) * 0.5 + 0.5;
    
    // Layered wave distortion
    float wave1 = sin(uv.x * frequency * 4.0 + time * 0.5) * cos(uv.y * frequency * 3.0 + time * 0.3);
    float wave2 = sin(uv.y * frequency * 5.0 - time * 0.4) * cos(uv.x * frequency * 2.0 + time * 0.6);
    float noise = snoise(vec2(uv.x * frequency + time * 0.15, uv.y * frequency + time * 0.1));
    
    // Radial soft vignette effect
    float radial = length(uv - 0.5);
    float vignette = 1.0 - radial * 0.5;
    
    vec2 displacement;
    displacement.x = (wave1 * pulse + noise * 0.5 * pulse2) * vignette * intensity * 0.04;
    displacement.y = (wave2 * pulse2 + noise * 0.3 * pulse) * vignette * intensity * 0.04;
    
    return displacement;
  }
  
  // Apply vignette effect
  vec3 applyVignette(vec3 color, vec2 uv, float strength) {
    float dist = length(uv - 0.5) * 2.0;
    float vig = 1.0 - smoothstep(0.5, 1.5, dist) * strength;
    return color * vig;
  }
  
  // Apply color tint
  vec3 applyTint(vec3 color, vec3 tintColor, float strength) {
    return mix(color, color * tintColor, strength);
  }
  
  // Apply bloom (fake bloom - brighten bright areas)
  vec3 applyBloom(vec3 color, float strength) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    float bloomFactor = smoothstep(0.5, 1.0, luminance) * strength;
    return color + color * bloomFactor * 1.5;
  }
  
  // Apply lightning flash
  vec3 applyLightning(vec3 color, float strength) {
    return color + vec3(strength);
  }
  
  // Apply desaturation
  vec3 applyDesaturate(vec3 color, float strength) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(gray), strength);
  }
  
  void main() {
    vec2 displacement = vec2(0.0);
    
    if (effectType == 0) {
      displacement = heatWaveDisplacement(vUv);
    } else if (effectType == 1) {
      displacement = underwaterDisplacement(vUv);
    } else if (effectType == 2) {
      displacement = glitchDisplacement(vUv);
    } else if (effectType == 3) {
      displacement = dreamDisplacement(vUv);
    }
    
    vec2 distortedUv = vUv + displacement * direction;
    
    // Clamp UV to prevent sampling outside texture
    distortedUv = clamp(distortedUv, 0.0, 1.0);
    
    vec3 color = texture2D(tDiffuse, distortedUv).rgb;
    
    // Apply color effects in order
    if (desaturate > 0.0) {
      color = applyDesaturate(color, desaturate);
    }
    if (tintStrength > 0.0) {
      color = applyTint(color, tint, tintStrength);
    }
    if (bloom > 0.0) {
      color = applyBloom(color, bloom);
    }
    if (vignette > 0.0) {
      color = applyVignette(color, vUv, vignette);
    }
    if (lightning > 0.0) {
      color = applyLightning(color, lightning);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Map effect type to shader int
const EFFECT_TYPE_MAP: Record<string, number> = {
  heatwave: 0,
  underwater: 1,
  glitch: 2,
  dream: 3,
};

// Color effect settings (layered on top of displacement)
export interface ColorEffects {
  vignette: number;      // 0-1 edge darkening
  tint: { r: number; g: number; b: number };  // RGB multiplier
  tintStrength: number;  // 0-1 tint blend
  bloom: number;         // 0-1 glow strength
  lightning: number;     // 0-1 flash brightness
  desaturate: number;    // 0-1 grayscale amount
}

const DEFAULT_COLOR_EFFECTS: ColorEffects = {
  vignette: 0,
  tint: { r: 1, g: 1, b: 1 },
  tintStrength: 0,
  bloom: 0,
  lightning: 0,
  desaturate: 0,
};

export class PostProcessorSystem {
  private renderTarget: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private config: PostProcessorConfig;
  private colorEffects: ColorEffects;
  private time: number = 0;
  private lightningTimer: number = 0;

  constructor(width: number, height: number, preset: string = 'heatwave', enabled: boolean = true) {
    const presetConfig = getPostProcessorPreset(preset) ?? HEATWAVE_PRESET.config;
    // Clone config and override enabled state
    this.config = { ...presetConfig, enabled };
    this.colorEffects = { ...DEFAULT_COLOR_EFFECTS };

    // Create render target to capture scene
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // Create fullscreen quad for post-processing
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        intensity: { value: this.config.intensity },
        frequency: { value: this.config.frequency },
        direction: { value: new THREE.Vector2(this.config.direction.x, this.config.direction.y) },
        effectType: { value: EFFECT_TYPE_MAP[this.config.type] ?? 0 },
        // Color effects
        vignette: { value: 0 },
        tint: { value: new THREE.Vector3(1, 1, 1) },
        tintStrength: { value: 0 },
        bloom: { value: 0 },
        lightning: { value: 0 },
        desaturate: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry, this.material);

    // Orthographic camera for fullscreen quad
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
  }

  /**
   * Update effect animation
   */
  update(deltaTime: number): void {
    if (!this.config.enabled) return;
    this.time += deltaTime * this.config.speed;
    this.material.uniforms.time.value = this.time;
    
    // Handle lightning decay
    if (this.colorEffects.lightning > 0) {
      this.colorEffects.lightning = Math.max(0, this.colorEffects.lightning - deltaTime * 3);
      this.material.uniforms.lightning.value = this.colorEffects.lightning;
    }
  }

  /**
   * Render scene with post-processing effect
   */
  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ): void {
    if (!this.config.enabled) {
      // Just render scene normally
      renderer.render(scene, camera);
      return;
    }

    // Render scene to texture
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    // Apply post-processing
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    renderer.render(this.scene, this.camera);
  }

  /**
   * Change effect preset
   */
  setPreset(preset: string): void {
    const newConfig = getPostProcessorPreset(preset);
    if (newConfig) {
      this.config = newConfig;
      this.updateUniforms();
    }
  }

  /**
   * Update shader uniforms from config
   */
  private updateUniforms(): void {
    this.material.uniforms.intensity.value = this.config.intensity;
    this.material.uniforms.frequency.value = this.config.frequency;
    this.material.uniforms.direction.value.set(this.config.direction.x, this.config.direction.y);
    this.material.uniforms.effectType.value = EFFECT_TYPE_MAP[this.config.type] ?? 0;
  }

  /**
   * Update color effect uniforms
   */
  private updateColorUniforms(): void {
    this.material.uniforms.vignette.value = this.colorEffects.vignette;
    this.material.uniforms.tint.value.set(
      this.colorEffects.tint.r,
      this.colorEffects.tint.g,
      this.colorEffects.tint.b
    );
    this.material.uniforms.tintStrength.value = this.colorEffects.tintStrength;
    this.material.uniforms.bloom.value = this.colorEffects.bloom;
    this.material.uniforms.lightning.value = this.colorEffects.lightning;
    this.material.uniforms.desaturate.value = this.colorEffects.desaturate;
  }

  /**
   * Enable/disable effect
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set effect intensity
   */
  setIntensity(intensity: number): void {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
    this.material.uniforms.intensity.value = this.config.intensity;
  }

  /**
   * Set vignette strength (0-1)
   */
  setVignette(strength: number): void {
    this.colorEffects.vignette = Math.max(0, Math.min(1, strength));
    this.material.uniforms.vignette.value = this.colorEffects.vignette;
  }

  /**
   * Set color tint
   */
  setTint(r: number, g: number, b: number, strength: number = 1): void {
    this.colorEffects.tint = { r, g, b };
    this.colorEffects.tintStrength = Math.max(0, Math.min(1, strength));
    this.material.uniforms.tint.value.set(r, g, b);
    this.material.uniforms.tintStrength.value = this.colorEffects.tintStrength;
  }

  /**
   * Set bloom strength (0-1)
   */
  setBloom(strength: number): void {
    this.colorEffects.bloom = Math.max(0, Math.min(1, strength));
    this.material.uniforms.bloom.value = this.colorEffects.bloom;
  }

  /**
   * Trigger lightning flash
   */
  triggerLightning(intensity: number = 1): void {
    this.colorEffects.lightning = Math.max(0, Math.min(1, intensity));
    this.material.uniforms.lightning.value = this.colorEffects.lightning;
  }

  /**
   * Set desaturation (0-1, 0=full color, 1=grayscale)
   */
  setDesaturate(amount: number): void {
    this.colorEffects.desaturate = Math.max(0, Math.min(1, amount));
    this.material.uniforms.desaturate.value = this.colorEffects.desaturate;
  }

  /**
   * Apply multiple color effects at once
   */
  setColorEffects(effects: Partial<ColorEffects>): void {
    if (effects.vignette !== undefined) this.colorEffects.vignette = effects.vignette;
    if (effects.tint !== undefined) this.colorEffects.tint = effects.tint;
    if (effects.tintStrength !== undefined) this.colorEffects.tintStrength = effects.tintStrength;
    if (effects.bloom !== undefined) this.colorEffects.bloom = effects.bloom;
    if (effects.desaturate !== undefined) this.colorEffects.desaturate = effects.desaturate;
    this.updateColorUniforms();
  }

  /**
   * Reset color effects to defaults
   */
  resetColorEffects(): void {
    this.colorEffects = { ...DEFAULT_COLOR_EFFECTS };
    this.updateColorUniforms();
  }

  /**
   * Resize render target
   */
  resize(width: number, height: number): void {
    this.renderTarget.setSize(width, height);
  }

  /**
   * Check if effect is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.renderTarget.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
