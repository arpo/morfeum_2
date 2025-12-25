/**
 * Post-Processor System
 * Applies image displacement and color effects (heat wave, underwater, bloom, vignette, etc.)
 */

import * as THREE from 'three';
import type { PostProcessorConfig } from './types';
import { getPostProcessorPreset, HEATWAVE_PRESET } from '.';
import { postProcessorVertexShader, postProcessorFragmentShader, EFFECT_TYPE_MAP } from './shaders';

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
      vertexShader: postProcessorVertexShader,
      fragmentShader: postProcessorFragmentShader,
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
