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
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
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

      renderFrame(
        this.displayMode, this.renderer, this.scene, this.stereoState.scene2,
        this.camera, this.container.clientWidth, this.container.clientHeight, this.scissor
      );
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

  dispose(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.cleanupMesh();
    this.stereoState = cleanupStereoScene(this.stereoState);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
