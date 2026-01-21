/**
 * Unified WebGL renderer for WorldView
 * Based on tiefling's geometry-based depth rendering approach
 */

import * as THREE from 'three';
import { WORLD_VIEW_3D_CONFIG } from '@/config';
import { createDepthShaderMaterial } from './shaders';
import { loadDepthMapData, createDepthGeometry, scaleMeshToFit } from './geometry';
import { StereoState, createStereoState, setupStereoScene, cleanupStereoScene } from './stereoRenderer';
import { CameraConfig, createCameraConfig, calculateScissorDimensions } from './cameraAnimation';
import { processAnimationFrame, renderFrame, ScissorDimensions } from './animationLoop';
import { ParticleSystem } from './effects/particles';
import { PostProcessorSystem } from './effects/postprocessors';
import type { ColorEffects } from './effects/postprocessors';
import {
  createSceneState,
  applyScenePreset,
  clearScenePreset,
  updateSceneEffects,
  colorEffectMethods
} from './sceneManager';
import {
  CrossfadeState,
  createCrossfadeState,
  startCrossfade,
  updateCrossfade as updateCrossfadeState,
  cleanupCrossfade,
  prepareNewMaterialForFadeIn
} from './crossfadeManager';

export type DisplayMode = '2d' | 'full' | 'hsbs';

export interface WorldViewRendererOptions {
  container: HTMLElement;
  focus?: number;
  displayMode?: DisplayMode;
}

export class WorldViewRenderer {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private container: HTMLElement;
  private animationId: number | null = null;

  // Settings
  private focus: number;
  private displayMode: DisplayMode;
  private meshDepth: number = WORLD_VIEW_3D_CONFIG.MESH_DEPTH;
  private meshResolution: number = WORLD_VIEW_3D_CONFIG.MESH_RESOLUTION;
  private cameraConfig: CameraConfig;
  private easing: number = WORLD_VIEW_3D_CONFIG.EASING;

  // Animation state
  private targetX: number = 0;
  private targetY: number = 0;
  private imageAspectRatio: number = 1;
  private scissor: ScissorDimensions = { scissorX: 0, scissorY: 0, scissorWidth: 0, scissorHeight: 0 };

  // Stereo rendering state
  private stereoState: StereoState;
  private mouseXOffset: number = 0.04;

  // Particle system
  private particleSystem: ParticleSystem | null = null;
  private lastFrameTime: number = 0;

  // Post-processor system
  private postProcessor: PostProcessorSystem | null = null;

  // Scene state
  private sceneState = createSceneState();

  // Crossfade state
  private crossfadeState: CrossfadeState = createCrossfadeState();

  constructor(options: WorldViewRendererOptions) {
    this.container = options.container;
    this.focus = options.focus ?? WORLD_VIEW_3D_CONFIG.FOCUS;
    this.displayMode = options.displayMode ?? 'full';
    this.cameraConfig = createCameraConfig();
    this.stereoState = createStereoState();

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, alpha: true, preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.z = this.cameraConfig.baseCameraZ;
    this.camera.lookAt(0, 0, 0);

    this.startAnimation();

    // Initialize particle system if enabled
    if (WORLD_VIEW_3D_CONFIG.PARTICLES?.ENABLED) {
      this.initParticles(
        WORLD_VIEW_3D_CONFIG.PARTICLES.PRESET || 'dust',
        WORLD_VIEW_3D_CONFIG.PARTICLES.DEPTH || 2
      );
    }

    // Initialize post-processor if enabled
    if (WORLD_VIEW_3D_CONFIG.POSTPROCESSOR?.ENABLED) {
      this.initPostProcessor(WORLD_VIEW_3D_CONFIG.POSTPROCESSOR.PRESET || 'heatwave');
    }

    // Apply scene preset if enabled (overrides individual particles/postprocessor settings)
    if (WORLD_VIEW_3D_CONFIG.SCENE?.ENABLED) {
      this.setScene(WORLD_VIEW_3D_CONFIG.SCENE.PRESET || 'sunset');
    }
  }

  /**
   * Initialize post-processor with a preset
   */
  private initPostProcessor(preset: string, enabled: boolean = true): void {
    this.postProcessor = new PostProcessorSystem(
      this.container.clientWidth,
      this.container.clientHeight,
      preset,
      enabled
    );
  }

  /**
   * Initialize particle system with a preset
   */
  private initParticles(preset: string, depth: number = 2): void {
    this.particleSystem = new ParticleSystem(preset, depth);
    this.particleSystem.createMesh(this.scene);
  }

  async load(imageUrl: string, depthUrl?: string | null): Promise<void> {
    const textureLoader = new THREE.TextureLoader();
    const imageTexture = await textureLoader.loadAsync(imageUrl);
    
    this.imageAspectRatio = imageTexture.image.width / imageTexture.image.height;
    this.updateScissorDimensions();

    if (depthUrl) {
      await this.createMeshWithDepth(imageTexture, depthUrl);
    } else {
      this.createFlatMesh(imageTexture);
    }
  }

  /**
   * Crossfade to a new image with smooth transition
   * @param imageUrl - New image URL
   * @param depthUrl - Optional depth map URL
   * @param duration - Transition duration in seconds (default 1.5s)
   */
  async crossfadeTo(imageUrl: string, depthUrl?: string | null, duration: number = 1.5): Promise<void> {
    if (!this.mesh || !this.material) {
      return this.load(imageUrl, depthUrl);
    }

    const textureLoader = new THREE.TextureLoader();
    const newTexture = await textureLoader.loadAsync(imageUrl);
    const newAspectRatio = newTexture.image.width / newTexture.image.height;

    // Start crossfade with old mesh/material
    this.crossfadeState = startCrossfade(
      this.crossfadeState,
      this.mesh,
      this.material,
      duration
    );

    // Create new mesh
    this.mesh = null;
    this.material = null;
    this.imageAspectRatio = newAspectRatio;
    this.updateScissorDimensions();

    if (depthUrl) {
      await this.createMeshWithDepth(newTexture, depthUrl);
    } else {
      this.createFlatMesh(newTexture);
    }

    // Prepare new material for fade-in
    if (this.material) {
      prepareNewMaterialForFadeIn(this.material as THREE.ShaderMaterial);
    }
  }

  /**
   * Update crossfade animation (called in animation loop)
   */
  private updateCrossfadeAnimation(): void {
    if (!this.crossfadeState.isActive) return;

    const { state, complete } = updateCrossfadeState(this.crossfadeState, this.material);
    this.crossfadeState = state;

    if (complete) {
      this.crossfadeState = cleanupCrossfade(this.crossfadeState, this.scene, this.material);
    }
  }

  private createFlatMesh(imageTexture: THREE.Texture): void {
    this.cleanupMesh();
    const geometry = new THREE.PlaneGeometry(this.imageAspectRatio, 1);
    this.material = createDepthShaderMaterial(imageTexture, this.focus, 0);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scaleMesh();
    this.scene.add(this.mesh);
    
    if (this.displayMode === 'hsbs') {
      this.stereoState = setupStereoScene(this.mesh, this.material, this.stereoState);
    }
  }

  private async createMeshWithDepth(imageTexture: THREE.Texture, depthUrl: string): Promise<void> {
    this.cleanupMesh();
    const depthData = await loadDepthMapData(depthUrl);
    const geometry = createDepthGeometry(depthData, {
      imageAspectRatio: this.imageAspectRatio,
      meshResolution: this.meshResolution,
      meshDepth: this.meshDepth
    });
    this.material = createDepthShaderMaterial(imageTexture, this.focus, this.meshDepth);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scaleMesh();
    this.scene.add(this.mesh);
    
    if (this.displayMode === 'hsbs') {
      this.stereoState = setupStereoScene(this.mesh, this.material, this.stereoState);
    }
  }

  private scaleMesh(): void {
    if (!this.mesh?.geometry) return;
    // Use baseCameraZ for consistent scaling (not current camera.position.z which animates)
    scaleMeshToFit(
      this.mesh, this.mesh.geometry as THREE.PlaneGeometry,
      this.container.clientWidth, this.container.clientHeight,
      this.imageAspectRatio, this.cameraConfig.baseCameraZ, this.camera.aspect
    );
  }

  private updateScissorDimensions(): void {
    this.scissor = calculateScissorDimensions(
      this.container.clientWidth, this.container.clientHeight, this.imageAspectRatio
    );
  }

  async updateDepthMap(depthUrl: string): Promise<void> {
    if (!this.material) return;
    const currentTexture = this.material.uniforms.map.value;
    if (currentTexture) await this.createMeshWithDepth(currentTexture, depthUrl);
  }

  private startAnimation(): void {
    this.lastFrameTime = performance.now();
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Calculate delta time for particle animation
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;
      
      // Only animate camera if we have a depth map (parallax requires depth)
      if (this.hasDepthMap()) {
        const state = {
          targetX: this.targetX, targetY: this.targetY,
          focus: this.focus, easing: this.easing,
          displayMode: this.displayMode, mouseXOffset: this.mouseXOffset
        };
        
        const smoothed = processAnimationFrame(
          state, this.cameraConfig, this.camera, this.material, this.stereoState
        );
        this.targetX = smoothed.targetX;
        this.targetY = smoothed.targetY;
      }

      // Update particles
      if (this.particleSystem) {
        this.particleSystem.update(deltaTime);
      }

      // Update post-processor
      if (this.postProcessor) {
        this.postProcessor.update(deltaTime);
      }

      // Update crossfade animation
      this.updateCrossfadeAnimation();

      // Update scene effects (wind gusts, lightning)
      this.sceneState = updateSceneEffects(
        deltaTime,
        this.sceneState,
        this.particleSystem,
        this.postProcessor
      );

      // Render with or without post-processing
      if (this.postProcessor && this.postProcessor.isEnabled()) {
        this.postProcessor.render(this.renderer, this.scene, this.camera);
      } else {
        renderFrame(
          this.displayMode, this.renderer, this.scene, this.stereoState.scene2,
          this.camera, this.container.clientWidth, this.container.clientHeight, this.scissor
        );
      }
    };
    animate();
  }

  resize(): void {
    const { clientWidth: width, clientHeight: height } = this.container;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.updateScissorDimensions();
    this.scaleMesh();
    if (this.stereoState.mesh2 && this.mesh) {
      this.stereoState.mesh2.scale.copy(this.mesh.scale);
    }
    if (this.postProcessor) {
      this.postProcessor.resize(width, height);
    }
  }

  setFocus(value: number): void {
    this.focus = value;
    if (this.material) this.material.uniforms.focus.value = value;
  }

  setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
    this.updateScissorDimensions();
    if (mode === 'hsbs') {
      this.stereoState = setupStereoScene(this.mesh, this.material, this.stereoState);
    } else {
      this.stereoState = cleanupStereoScene(this.stereoState);
    }
  }

  private cleanupMesh(): void {
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
    if (this.material) this.material.dispose();
  }

  hasDepthMap(): boolean { return this.material?.uniforms.meshDepth.value > 0; }

  /**
   * Set particle preset (dust, snow, rain, fireflies)
   */
  setParticlePreset(preset: string): void {
    if (this.particleSystem) {
      this.particleSystem.setPreset(preset);
    } else {
      this.initParticles(preset);
    }
  }

  /**
   * Enable/disable particles
   */
  setParticlesEnabled(enabled: boolean): void {
    if (this.particleSystem) {
      this.particleSystem.setEnabled(enabled);
    } else if (enabled) {
      this.initParticles('dust');
    }
  }

  /**
   * Set post-processor preset (heatwave, underwater, glitch, dream)
   */
  setPostProcessorPreset(preset: string): void {
    if (this.postProcessor) {
      this.postProcessor.setPreset(preset);
    } else {
      this.initPostProcessor(preset);
    }
  }

  /**
   * Enable/disable post-processor
   */
  setPostProcessorEnabled(enabled: boolean): void {
    if (this.postProcessor) {
      this.postProcessor.setEnabled(enabled);
    } else if (enabled) {
      this.initPostProcessor('heatwave');
    }
  }

  /**
   * Set post-processor intensity (0-1)
   */
  setPostProcessorIntensity(intensity: number): void {
    if (this.postProcessor) {
      this.postProcessor.setIntensity(intensity);
    }
  }

  // ===== Color Effect Methods (delegated to sceneManager) =====

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

  // ===== Wind Gust Methods =====

  /**
   * Trigger a wind gust on particles
   */
  triggerWindGust(strengthX: number = 2, strengthY: number = 0, duration: number = 1.5): void {
    this.particleSystem?.triggerWindGust(strengthX, strengthY, duration);
  }

  // ===== Scene Preset Methods (delegated to sceneManager) =====

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

  /**
   * Ensure post-processor is initialized
   */
  private ensurePostProcessor(): void {
    if (!this.postProcessor) {
      this.postProcessor = new PostProcessorSystem(
        this.container.clientWidth,
        this.container.clientHeight,
        'heatwave',
        true
      );
      this.postProcessor.setIntensity(0); // No displacement by default
    }
  }

  dispose(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.cleanupMesh();
    this.stereoState = cleanupStereoScene(this.stereoState);
    if (this.particleSystem) {
      this.particleSystem.dispose(this.scene);
      this.particleSystem = null;
    }
    if (this.postProcessor) {
      this.postProcessor.dispose();
      this.postProcessor = null;
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
