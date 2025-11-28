import * as THREE from 'three';

export interface WorldViewRendererOptions {
  container: HTMLElement;
}

/**
 * Unified WebGL renderer for WorldView
 * Handles both 2D (flat) and 3D (depth-displaced) rendering
 * Features organic camera drift animation
 */
export class WorldViewRenderer {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private container: HTMLElement;
  private animationId: number | null = null;
  private startTime: number = 0;
  private currentDepthScale: number = 0;
  private targetDepthScale: number = 0;
  private depthScaleTransitionStart: number = 0;
  private isTransitioning: boolean = false;

  // Camera base position
  private readonly cameraBaseZ = 1.0;

  constructor(options: WorldViewRendererOptions) {
    this.container = options.container;
    this.scene = new THREE.Scene();
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.z = this.cameraBaseZ;

    this.startTime = performance.now();
    this.startAnimation();
  }

  /**
   * Load image and optionally depth map
   */
  async load(imageUrl: string, depthUrl?: string | null): Promise<void> {
    const loader = new THREE.TextureLoader();
    
    // Load textures
    const [imageTex, depthTex] = await Promise.all([
      loader.loadAsync(imageUrl),
      depthUrl ? loader.loadAsync(depthUrl) : Promise.resolve(null)
    ]);

    // Configure textures
    imageTex.minFilter = THREE.LinearFilter;
    imageTex.magFilter = THREE.LinearFilter;
    
    if (depthTex) {
      depthTex.minFilter = THREE.LinearFilter;
      depthTex.magFilter = THREE.LinearFilter;
    }

    // Calculate aspect ratio from image
    const imageAspect = imageTex.image.width / imageTex.image.height;
    
    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uImage: { value: imageTex },
        uDepth: { value: depthTex },
        uDepthScale: { value: this.currentDepthScale },
        uHasDepth: { value: depthTex !== null }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform sampler2D uDepth;
        uniform float uDepthScale;
        uniform bool uHasDepth;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          if (uHasDepth && uDepthScale > 0.0) {
            float depth = texture2D(uDepth, uv).r;
            // Invert depth: white (1.0) = close, black (0.0) = far
            depth = 1.0 - depth;
            pos.z += depth * uDepthScale;
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uImage;
        
        void main() {
          gl_FragColor = texture2D(uImage, vUv);
        }
      `,
      side: THREE.DoubleSide
    });

    // Create geometry with enough segments for smooth displacement
    const geometry = new THREE.PlaneGeometry(imageAspect, 1, 128, 128);
    
    // Remove old mesh if exists
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    // If depth map loaded, start transition to 3D
    if (depthTex) {
      this.animateDepthScale(0.15);
    }
  }

  /**
   * Update depth map for existing image
   */
  async updateDepthMap(depthUrl: string): Promise<void> {
    if (!this.material) return;

    const loader = new THREE.TextureLoader();
    const depthTex = await loader.loadAsync(depthUrl);
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.magFilter = THREE.LinearFilter;

    this.material.uniforms.uDepth.value = depthTex;
    this.material.uniforms.uHasDepth.value = true;
    
    // Animate depth scale from current to target
    this.animateDepthScale(0.15);
  }

  /**
   * Animate depth scale transition
   */
  private animateDepthScale(target: number): void {
    this.targetDepthScale = target;
    this.depthScaleTransitionStart = performance.now();
    this.isTransitioning = true;
  }

  /**
   * Set depth scale directly (for external control)
   */
  setDepthScale(value: number): void {
    this.currentDepthScale = value;
    this.targetDepthScale = value;
    this.isTransitioning = false;
    if (this.material) {
      this.material.uniforms.uDepthScale.value = value;
    }
  }

  /**
   * Main animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const time = (performance.now() - this.startTime) / 1000;
      
      // Update depth scale transition (ease-out over 1.5 seconds)
      if (this.isTransitioning && this.material) {
        const elapsed = (performance.now() - this.depthScaleTransitionStart) / 1000;
        const duration = 1.5;
        
        if (elapsed < duration) {
          // Ease-out cubic
          const t = 1 - Math.pow(1 - elapsed / duration, 3);
          this.currentDepthScale = t * this.targetDepthScale;
          this.material.uniforms.uDepthScale.value = this.currentDepthScale;
        } else {
          this.currentDepthScale = this.targetDepthScale;
          this.material.uniforms.uDepthScale.value = this.currentDepthScale;
          this.isTransitioning = false;
        }
      }

      // Organic camera drift with different frequencies
      // Using prime-ish multipliers for non-repeating pattern
      const driftX = Math.sin(time * 0.31) * 0.018;   // ~20s cycle
      const driftY = Math.sin(time * 0.23) * 0.012;   // ~27s cycle
      const driftZ = Math.sin(time * 0.17) * 0.025;   // ~37s cycle

      this.camera.position.x = driftX;
      this.camera.position.y = driftY;
      this.camera.position.z = this.cameraBaseZ + driftZ;
      
      // Look at center of scene
      this.camera.lookAt(0, 0, 0);

      this.renderer.render(this.scene, this.camera);
    };

    animate();
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
  }

  /**
   * Check if currently has depth map
   */
  hasDepthMap(): boolean {
    return this.material?.uniforms.uHasDepth.value ?? false;
  }

  /**
   * Get current depth scale
   */
  getDepthScale(): number {
    return this.currentDepthScale;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    if (this.material) {
      this.material.dispose();
      if (this.material.uniforms.uImage.value) {
        this.material.uniforms.uImage.value.dispose();
      }
      if (this.material.uniforms.uDepth.value) {
        this.material.uniforms.uDepth.value.dispose();
      }
    }

    this.renderer.dispose();
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
