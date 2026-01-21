/**
 * Effects Controller for WorldView
 * Centralized management of particles, post-processing, and scene effects
 */

import * as THREE from 'three';
import { ParticleSystem } from './effects/particles';
import { PostProcessorSystem } from './effects/postprocessors';
import type { ColorEffects } from './effects/postprocessors';
import {
  createSceneState,
  applyScenePreset,
  clearScenePreset,
  updateSceneEffects,
  colorEffectMethods,
  SceneState
} from './sceneManager';

export interface EffectsControllerOptions {
  containerWidth: number;
  containerHeight: number;
  particlesEnabled?: boolean;
  particlesPreset?: string;
  particlesDepth?: number;
  postProcessorEnabled?: boolean;
  postProcessorPreset?: string;
  sceneEnabled?: boolean;
  scenePreset?: string;
}

export class EffectsController {
  private particleSystem: ParticleSystem | null = null;
  private postProcessor: PostProcessorSystem | null = null;
  private sceneState: SceneState = createSceneState();
  private containerWidth: number;
  private containerHeight: number;

  constructor(options: EffectsControllerOptions) {
    this.containerWidth = options.containerWidth;
    this.containerHeight = options.containerHeight;

    // Initialize particle system if enabled
    if (options.particlesEnabled) {
      this.initParticles(
        options.particlesPreset || 'dust',
        options.particlesDepth || 2
      );
    }

    // Initialize post-processor if enabled
    if (options.postProcessorEnabled) {
      this.initPostProcessor(options.postProcessorPreset || 'heatwave');
    }

    // Apply scene preset if enabled (overrides individual settings)
    if (options.sceneEnabled) {
      this.setScene(options.scenePreset || 'sunset');
    }
  }

  /**
   * Initialize particle system with a preset
   */
  initParticles(preset: string, depth: number = 2): void {
    this.particleSystem = new ParticleSystem(preset, depth);
  }

  /**
   * Create particle mesh and add to scene
   */
  createParticleMesh(scene: THREE.Scene): void {
    if (this.particleSystem) {
      this.particleSystem.createMesh(scene);
    }
  }

  /**
   * Initialize post-processor with a preset
   */
  initPostProcessor(preset: string, enabled: boolean = true): void {
    this.postProcessor = new PostProcessorSystem(
      this.containerWidth,
      this.containerHeight,
      preset,
      enabled
    );
  }

  /**
   * Update effects each frame
   */
  update(deltaTime: number): void {
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }
    if (this.postProcessor) {
      this.postProcessor.update(deltaTime);
    }
    this.sceneState = updateSceneEffects(
      deltaTime,
      this.sceneState,
      this.particleSystem,
      this.postProcessor
    );
  }

  /**
   * Render with post-processing if enabled
   */
  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ): boolean {
    if (this.postProcessor && this.postProcessor.isEnabled()) {
      this.postProcessor.render(renderer, scene, camera);
      return true;
    }
    return false;
  }

  /**
   * Handle resize
   */
  resize(width: number, height: number): void {
    this.containerWidth = width;
    this.containerHeight = height;
    if (this.postProcessor) {
      this.postProcessor.resize(width, height);
    }
  }

  // ===== Particle Methods =====

  setParticlePreset(preset: string): void {
    if (this.particleSystem) {
      this.particleSystem.setPreset(preset);
    } else {
      this.initParticles(preset);
    }
  }

  setParticlesEnabled(enabled: boolean): void {
    if (this.particleSystem) {
      this.particleSystem.setEnabled(enabled);
    } else if (enabled) {
      this.initParticles('dust');
    }
  }

  triggerWindGust(strengthX: number = 2, strengthY: number = 0, duration: number = 1.5): void {
    this.particleSystem?.triggerWindGust(strengthX, strengthY, duration);
  }

  // ===== Post-Processor Methods =====

  setPostProcessorPreset(preset: string): void {
    if (this.postProcessor) {
      this.postProcessor.setPreset(preset);
    } else {
      this.initPostProcessor(preset);
    }
  }

  setPostProcessorEnabled(enabled: boolean): void {
    if (this.postProcessor) {
      this.postProcessor.setEnabled(enabled);
    } else if (enabled) {
      this.initPostProcessor('heatwave');
    }
  }

  setPostProcessorIntensity(intensity: number): void {
    if (this.postProcessor) {
      this.postProcessor.setIntensity(intensity);
    }
  }

  // ===== Color Effect Methods =====

  private ensurePostProcessor(): void {
    if (!this.postProcessor) {
      this.postProcessor = new PostProcessorSystem(
        this.containerWidth,
        this.containerHeight,
        'heatwave',
        true
      );
      this.postProcessor.setIntensity(0);
    }
  }

  setVignette(strength: number): void {
    this.ensurePostProcessor();
    colorEffectMethods.setVignette(this.postProcessor, strength);
  }

  setTint(r: number, g: number, b: number, strength: number = 1): void {
    this.ensurePostProcessor();
    colorEffectMethods.setTint(this.postProcessor, r, g, b, strength);
  }

  setBloom(strength: number): void {
    this.ensurePostProcessor();
    colorEffectMethods.setBloom(this.postProcessor, strength);
  }

  triggerLightning(intensity: number = 1): void {
    this.ensurePostProcessor();
    colorEffectMethods.triggerLightning(this.postProcessor, intensity);
  }

  setDesaturate(amount: number): void {
    this.ensurePostProcessor();
    colorEffectMethods.setDesaturate(this.postProcessor, amount);
  }

  setColorEffects(effects: Partial<ColorEffects>): void {
    this.ensurePostProcessor();
    colorEffectMethods.setColorEffects(this.postProcessor, effects);
  }

  resetColorEffects(): void {
    colorEffectMethods.resetColorEffects(this.postProcessor);
  }

  // ===== Scene Preset Methods =====

  setScene(sceneName: string): void {
    const scene = applyScenePreset(
      sceneName,
      this.particleSystem,
      this.postProcessor,
      (preset) => this.initParticles(preset),
      () => this.ensurePostProcessor()
    );
    if (scene) {
      this.sceneState = { currentScene: scene, timers: { windGust: 0, lightning: 0 } };
    }
  }

  clearScene(): void {
    this.sceneState = clearScenePreset(this.postProcessor);
  }

  // ===== Cleanup =====

  dispose(scene: THREE.Scene): void {
    if (this.particleSystem) {
      this.particleSystem.dispose(scene);
      this.particleSystem = null;
    }
    if (this.postProcessor) {
      this.postProcessor.dispose();
      this.postProcessor = null;
    }
  }
}
