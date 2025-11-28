import * as THREE from 'three';
import { WORLD_VIEW_3D_CONFIG } from '@/config';

export type DisplayMode = '2d' | 'full' | 'hsbs';

export interface WorldViewRendererOptions {
  container: HTMLElement;
  focus?: number;
  displayMode?: DisplayMode;
}

/**
 * Unified WebGL renderer for WorldView
 * Based on tiefling's geometry-based depth rendering approach
 */
export class WorldViewRenderer {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private container: HTMLElement;
  private animationId: number | null = null;

  // Settings (from config)
  private focus: number;
  private displayMode: DisplayMode;
  private meshDepth: number = WORLD_VIEW_3D_CONFIG.MESH_DEPTH;
  private meshResolution: number = WORLD_VIEW_3D_CONFIG.MESH_RESOLUTION;
  private cameraAmplitudeX: number = WORLD_VIEW_3D_CONFIG.CAMERA_AMPLITUDE.X;
  private cameraAmplitudeY: number = WORLD_VIEW_3D_CONFIG.CAMERA_AMPLITUDE.Y;
  private cameraAmplitudeZ: number = WORLD_VIEW_3D_CONFIG.CAMERA_AMPLITUDE.Z;
  private cameraSpeedX: number = WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.X;
  private cameraSpeedY: number = WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.Y;
  private cameraSpeedZ: number = WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.Z;
  private cameraPositionX: number = WORLD_VIEW_3D_CONFIG.CAMERA_POSITION.X;
  private cameraPositionY: number = WORLD_VIEW_3D_CONFIG.CAMERA_POSITION.Y;
  private baseCameraZ: number = 4; // Base camera Z position

  // Animation state
  private targetX: number = 0;
  private targetY: number = 0;
  private imageAspectRatio: number = 1;
  private easing: number = WORLD_VIEW_3D_CONFIG.EASING;

  // Scissor dimensions for letterboxing
  private scissorX: number = 0;
  private scissorY: number = 0;
  private scissorWidth: number = 0;
  private scissorHeight: number = 0;

  // Stereo rendering (for hsbs, fsbs, anaglyph modes)
  private scene2: THREE.Scene | null = null;
  private mesh2: THREE.Mesh | null = null;
  private material2: THREE.ShaderMaterial | null = null;
  private mouseXOffset: number = 0.04;

  constructor(options: WorldViewRendererOptions) {
    this.container = options.container;
    this.focus = options.focus ?? WORLD_VIEW_3D_CONFIG.FOCUS;
    this.displayMode = options.displayMode ?? 'full';

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Fixed camera at z=4 (tiefling approach)
    const fov = 45;
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    this.camera.position.z = 4;
    this.camera.lookAt(0, 0, 0);

    this.startAnimation();
  }

  /**
   * Load image and optionally depth map
   */
  async load(imageUrl: string, depthUrl?: string | null): Promise<void> {
    // Load image texture
    const textureLoader = new THREE.TextureLoader();
    const imageTexture = await textureLoader.loadAsync(imageUrl);
    
    this.imageAspectRatio = imageTexture.image.width / imageTexture.image.height;
    this.updateScissorDimensions();

    // If we have a depth map, create 3D geometry
    if (depthUrl) {
      await this.createMeshWithDepth(imageTexture, depthUrl);
    } else {
      // No depth map - create flat plane
      this.createFlatMesh(imageTexture);
    }
  }

  /**
   * Create flat mesh without depth (2D mode)
   */
  private createFlatMesh(imageTexture: THREE.Texture): void {
    this.cleanupMesh();

    const geometry = new THREE.PlaneGeometry(this.imageAspectRatio, 1);
    
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: imageTexture },
        mouseDelta: { value: new THREE.Vector2(0, 0) },
        focus: { value: this.focus },
        meshDepth: { value: 0 },
        sensitivity: { value: 0.5 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scaleMeshToFit(this.mesh, geometry);
    this.scene.add(this.mesh);
  }

  /**
   * Create mesh with depth-baked geometry (3D mode)
   */
  private async createMeshWithDepth(imageTexture: THREE.Texture, depthUrl: string): Promise<void> {
    this.cleanupMesh();

    // Load depth map as image data
    const depthData = await this.loadDepthMapData(depthUrl);
    
    // Create geometry with depth baked into vertices
    const geometry = this.createDepthGeometry(depthData);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: imageTexture },
        mouseDelta: { value: new THREE.Vector2(0, 0) },
        focus: { value: this.focus },
        meshDepth: { value: this.meshDepth },
        sensitivity: { value: 0.5 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scaleMeshToFit(this.mesh, geometry);
    this.scene.add(this.mesh);
  }

  /**
   * Load depth map as ImageData
   */
  private async loadDepthMapData(depthUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = depthUrl;
    });
  }

  /**
   * Create geometry with depth values baked into vertices
   * This is the key to tiefling's approach
   */
  private createDepthGeometry(depthData: ImageData): THREE.PlaneGeometry {
    const width = Math.min(this.meshResolution, depthData.width);
    const height = Math.min(this.meshResolution, depthData.height);
    
    const geometry = new THREE.PlaneGeometry(
      this.imageAspectRatio,
      1,
      width - 1,
      height - 1
    );

    const vertices = geometry.attributes.position.array as Float32Array;
    const uvs = geometry.attributes.uv.array as Float32Array;
    const depths = new Float32Array(vertices.length / 3);

    // First pass: compute depths and positions
    for (let i = 0; i < vertices.length; i += 3) {
      const uvIndex = (i / 3) * 2;
      const u = Math.min(1, Math.max(0, uvs[uvIndex]));
      const v = Math.min(1, Math.max(0, uvs[uvIndex + 1]));

      // Sample depth from depth map
      const x = Math.floor(u * (depthData.width - 1));
      const y = Math.floor((1 - v) * (depthData.height - 1));
      const pixelIndex = (y * depthData.width + x) * 4;
      
      let depthValue = 0;
      if (pixelIndex + 3 < depthData.data.length) {
        depthValue = depthData.data[pixelIndex] / 255;
      }

      // Bake depth into Z position
      const z = depthValue * this.meshDepth;
      
      // Perspective scaling - nearer objects appear larger
      const scaleFactor = (4 - z) / 4;
      
      vertices[i] *= scaleFactor;     // X
      vertices[i + 1] *= scaleFactor; // Y
      vertices[i + 2] = z;            // Z

      depths[i / 3] = depthValue;
    }

    // Smoothing pass for jagged edges (like tiefling does)
    this.smoothGeometryEdges(vertices, depths, width, height);

    geometry.setAttribute('depth', new THREE.BufferAttribute(depths, 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Smooth jagged edges in geometry (from tiefling)
   */
  private smoothGeometryEdges(
    vertices: Float32Array, 
    depths: Float32Array, 
    gridWidth: number, 
    gridHeight: number
  ): void {
    // Create depth grid for gradient calculation
    const depthGrid: number[][] = [];
    const gradientGrid: { dx: number; dy: number; mag: number }[][] = [];
    
    for (let x = 0; x < gridWidth; x++) {
      depthGrid[x] = [];
      gradientGrid[x] = [];
      for (let y = 0; y < gridHeight; y++) {
        const i = y * gridWidth + x;
        depthGrid[x][y] = depths[i] || 0;
      }
    }

    // Calculate gradients
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const dx = (x < gridWidth - 1 ? depthGrid[x + 1][y] : depthGrid[x][y]) -
                   (x > 0 ? depthGrid[x - 1][y] : depthGrid[x][y]);
        const dy = (y < gridHeight - 1 ? depthGrid[x][y + 1] : depthGrid[x][y]) -
                   (y > 0 ? depthGrid[x][y - 1] : depthGrid[x][y]);
        gradientGrid[x][y] = { dx, dy, mag: Math.sqrt(dx * dx + dy * dy) };
      }
    }

    // Smoothing iterations
    const smoothIterations = 2;
    for (let iter = 0; iter < smoothIterations; iter++) {
      for (let i = 0; i < vertices.length; i += 3) {
        const vertexIndex = i / 3;
        const x = vertexIndex % gridWidth;
        const y = Math.floor(vertexIndex / gridWidth);

        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight && 
            gradientGrid[x][y].mag > 0.08) {
          let avgX = 0, avgY = 0, avgZ = 0, count = 0;

          // Average with neighbors
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                const idx = (ny * gridWidth + nx) * 3;
                if (idx >= 0 && idx + 2 < vertices.length) {
                  avgX += vertices[idx];
                  avgY += vertices[idx + 1];
                  avgZ += vertices[idx + 2];
                  count++;
                }
              }
            }
          }

          if (count > 0) {
            vertices[i] = avgX / count;
            vertices[i + 1] = avgY / count;
            vertices[i + 2] = avgZ / count;
          }
        }
      }
    }
  }

  /**
   * Scale mesh to fit the container
   */
  private scaleMeshToFit(mesh: THREE.Mesh, geometry: THREE.PlaneGeometry): void {
    const containerAspect = this.container.clientWidth / this.container.clientHeight;
    const fov = 45;
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * this.camera.position.z;
    const visibleWidth = visibleHeight * this.camera.aspect;

    let scale: number;
    if (containerAspect > this.imageAspectRatio) {
      scale = visibleHeight / geometry.parameters.height;
    } else {
      scale = visibleWidth / geometry.parameters.width;
    }

    mesh.scale.set(scale, scale, 1);
  }

  /**
   * Update depth map for existing image
   */
  async updateDepthMap(depthUrl: string): Promise<void> {
    if (!this.material) return;

    // Get current texture
    const currentTexture = this.material.uniforms.map.value;
    if (currentTexture) {
      await this.createMeshWithDepth(currentTexture, depthUrl);
    }
  }

  /**
   * Vertex shader - tiefling's parallax approach
   */
  private getVertexShader(): string {
    return `
      uniform vec2 mouseDelta;
      uniform float focus;
      uniform float meshDepth;
      uniform float sensitivity;
      
      attribute float depth;
      
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        float actualDepth = depth * meshDepth;
        float focusDepth = focus * meshDepth;
        
        // Rotational displacement (relative to focus depth)
        // Objects at focus depth stay still, others shift based on mouse
        vec2 rotate = mouseDelta * sensitivity * 
            (1.0 - focus) * 
            (actualDepth - focusDepth) * 
            vec2(-1.0, 1.0);
        
        // Edge preservation - don't move vertices at image edges
        float edgeWidth = 0.02;
        vec2 edgeFactorVec = smoothstep(0.0, edgeWidth, vUv) * 
                            smoothstep(1.0, 1.0 - edgeWidth, vUv);
        float edgeFactor = edgeFactorVec.x * edgeFactorVec.y;
        
        // Apply displacement with edge preservation
        pos.xy += rotate * edgeFactor;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
  }

  /**
   * Fragment shader
   */
  private getFragmentShader(): string {
    return `
      uniform sampler2D map;
      varying vec2 vUv;

      void main() {
        gl_FragColor = texture2D(map, vUv);
      }
    `;
  }

  /**
   * Update scissor dimensions for letterboxing
   */
  private updateScissorDimensions(): void {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const containerAspect = containerWidth / containerHeight;

    if (containerAspect > this.imageAspectRatio) {
      this.scissorHeight = containerHeight;
      this.scissorWidth = containerHeight * this.imageAspectRatio;
    } else {
      this.scissorWidth = containerWidth;
      this.scissorHeight = containerWidth / this.imageAspectRatio;
    }
    this.scissorX = (containerWidth - this.scissorWidth) / 2;
    this.scissorY = (containerHeight - this.scissorHeight) / 2;
  }

  /**
   * Main animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Get current camera movement position (all zeros for 2D mode)
      const { x: mouseX, y: mouseY, z: cameraZ, posX, posY } = this.displayMode === '2d' 
        ? { x: 0, y: 0, z: 0, posX: 0, posY: 0 } 
        : this.getCameraMovementPosition();
      
      // Update camera position for tilt effect (see mesh from angle)
      this.camera.position.x = posX;
      this.camera.position.y = posY;
      this.camera.position.z = this.baseCameraZ + cameraZ;
      this.camera.lookAt(0, 0, 0); // Always focus on center of image
      
      // Smooth easing toward target
      const mouseSensitivityFocusFactor = 0.3 + 0.7 * 2 * this.focus;
      this.targetX += (mouseSensitivityFocusFactor * mouseX * 0.5 - this.targetX) * this.easing;
      this.targetY += (mouseSensitivityFocusFactor * mouseY * 0.5 - this.targetY) * this.easing;

      // Update shader uniforms
      if (this.material) {
        this.material.uniforms.mouseDelta.value.set(this.targetX, -this.targetY);
        this.material.uniforms.focus.value = this.focus;
      }

      // Render based on display mode
      if (this.displayMode === 'hsbs') {
        this.renderStereo();
      } else {
        this.renderMono();
      }
    };

    animate();
  }

  /**
   * Render single view (2D or full 3D)
   */
  private renderMono(): void {
    if (this.scissorWidth > 0 && this.scissorHeight > 0) {
      this.renderer.setScissorTest(true);
      this.renderer.setScissor(this.scissorX, this.scissorY, this.scissorWidth, this.scissorHeight);
      this.renderer.setViewport(0, 0, this.container.clientWidth, this.container.clientHeight);
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Render stereo side-by-side (HSBS)
   */
  private renderStereo(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const halfWidth = width / 2;

    // Update right eye material with offset
    if (this.material2) {
      // Right eye has offset for stereo separation
      this.material2.uniforms.mouseDelta.value.set(
        this.targetX + this.mouseXOffset * 2, 
        -this.targetY
      );
      this.material2.uniforms.focus.value = this.focus;
    }

    this.renderer.setScissorTest(true);

    // Left eye - left half of screen
    this.renderer.setViewport(0, 0, halfWidth, height);
    this.renderer.setScissor(0, 0, halfWidth, height);
    this.renderer.render(this.scene, this.camera);

    // Right eye - right half of screen
    if (this.scene2) {
      this.renderer.setViewport(halfWidth, 0, halfWidth, height);
      this.renderer.setScissor(halfWidth, 0, halfWidth, height);
      this.renderer.render(this.scene2, this.camera);
    }
  }

  /**
   * Get camera movement position (independent circular patterns for X, Y, Z)
   */
  private getCameraMovementPosition(): { x: number; y: number; z: number; posX: number; posY: number } {
    const now = Date.now();
    
    // Independent circular motion for each axis with different speeds
    const x = Math.cos(now * this.cameraSpeedX) * this.cameraAmplitudeX;
    const y = Math.sin(now * this.cameraSpeedY) * this.cameraAmplitudeY;
    // Z only zooms IN (negative = closer to image), never OUT to avoid black edges
    const z = -Math.abs(Math.sin(now * this.cameraSpeedZ) * this.cameraAmplitudeZ);
    
    // Physical camera position for tilt effect (uses same timing as parallax)
    const posX = Math.cos(now * this.cameraSpeedX) * this.cameraPositionX;
    const posY = Math.sin(now * this.cameraSpeedY) * this.cameraPositionY;

    return { x, y, z, posX, posY };
  }

  /**
   * Handle container resize
   */
  resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    this.updateScissorDimensions();

    // Rescale mesh
    if (this.mesh && this.mesh.geometry) {
      this.scaleMeshToFit(this.mesh, this.mesh.geometry as THREE.PlaneGeometry);
    }
  }

  /**
   * Set focus plane (0 = far, 1 = near)
   */
  setFocus(value: number): void {
    this.focus = value;
    if (this.material) {
      this.material.uniforms.focus.value = value;
    }
  }

  /**
   * Set display mode
   */
  setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
    
    // Update scissor dimensions when mode changes
    this.updateScissorDimensions();
    
    // Create/destroy second scene for stereo modes
    if (mode === 'hsbs') {
      this.setupStereoScene();
    } else {
      this.cleanupStereoScene();
    }
  }

  /**
   * Setup second scene for stereo rendering
   */
  private setupStereoScene(): void {
    if (this.scene2) return; // Already set up
    
    this.scene2 = new THREE.Scene();
    this.scene2.background = null;
    
    // Clone the mesh for the right eye view
    if (this.mesh && this.material) {
      const geometry = this.mesh.geometry.clone();
      this.material2 = this.material.clone();
      this.mesh2 = new THREE.Mesh(geometry, this.material2);
      this.mesh2.scale.copy(this.mesh.scale);
      this.scene2.add(this.mesh2);
    }
  }

  /**
   * Cleanup stereo scene
   */
  private cleanupStereoScene(): void {
    if (this.mesh2) {
      this.scene2?.remove(this.mesh2);
      this.mesh2.geometry.dispose();
      this.mesh2 = null;
    }
    if (this.material2) {
      this.material2.dispose();
      this.material2 = null;
    }
    this.scene2 = null;
  }

  /**
   * Clean up mesh and materials
   */
  private cleanupMesh(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }

  /**
   * Check if currently has depth
   */
  hasDepthMap(): boolean {
    return this.material?.uniforms.meshDepth.value > 0;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.cleanupMesh();

    this.renderer.dispose();
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
