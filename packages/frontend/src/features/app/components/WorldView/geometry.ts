/**
 * Geometry utilities for WorldView
 * Handles depth map loading and geometry creation with baked depth
 */

import * as THREE from 'three';
import { WORLD_VIEW_3D_CONFIG } from '@/config';

export interface DepthGeometryOptions {
  imageAspectRatio: number;
  meshResolution: number;
  meshDepth: number;
}

/**
 * Expand/dilate depth map to reduce edge artifacts
 * This spreads depth values outward to fill gaps at object boundaries
 * Based on tiefling's approach, with optional depth-dependent scaling
 * 
 * @param imageData - The depth map image data
 * @param radius - Maximum dilation radius (for nearest objects)
 * @param depthScale - If true, scale expansion by depth (near=more, far=less)
 */
export function expandDepthMap(
  imageData: ImageData, 
  radius: number, 
  depthScale: boolean = false,
  minScale: number = 0.1
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = new Uint8ClampedArray(imageData.data);
  const dst = new Uint8ClampedArray(src);
  
  // Track how many iterations each pixel has been dilated
  const dilationCount = new Uint8Array(width * height);

  for (let r = 0; r < radius; r++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const pixelIdx = y * width + x;
        const currentDepth = src[idx];

        // Skip very dark pixels (far background)
        if (currentDepth < 10) continue;

        // Calculate effective radius for this pixel based on its depth
        let effectiveRadius = radius;
        if (depthScale) {
          // Scale radius by depth: near (255) = full radius, far (0) = minScale of radius
          // minScale controls the floor for far objects (0.0 = no expansion, 1.0 = full)
          const depthFactor = currentDepth / 255;
          const scaledFactor = minScale + (1 - minScale) * depthFactor;
          effectiveRadius = Math.max(1, Math.floor(radius * scaledFactor));
        }

        // Skip if this pixel has already been dilated enough times
        if (dilationCount[pixelIdx] >= effectiveRadius) continue;

        // Simple dilation: spread to adjacent pixels
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const nPixelIdx = (y + dy) * width + (x + dx);
            
            if (src[nIdx] < currentDepth) {
              dst[nIdx] = currentDepth;
              dst[nIdx + 1] = currentDepth;
              dst[nIdx + 2] = currentDepth;
              // Mark neighbor as dilated from this source
              dilationCount[nPixelIdx] = dilationCount[pixelIdx] + 1;
            }
          }
        }
      }
    }
    // Update source for next iteration
    src.set(dst);
  }
  
  return new ImageData(dst, width, height);
}

/**
 * Load depth map as ImageData from URL
 * Applies depth map expansion if configured
 */
export async function loadDepthMapData(depthUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply depth map expansion to reduce edge artifacts
      const expandRadius = WORLD_VIEW_3D_CONFIG.EXPAND_DEPTHMAP_RADIUS;
      const depthScale = WORLD_VIEW_3D_CONFIG.EXPAND_DEPTHMAP_DEPTH_SCALE;
      const minScale = WORLD_VIEW_3D_CONFIG.EXPAND_DEPTHMAP_MIN_SCALE;
      if (expandRadius > 0) {
        imageData = expandDepthMap(imageData, expandRadius, depthScale, minScale);
      }
      
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
export function createDepthGeometry(
  depthData: ImageData,
  options: DepthGeometryOptions
): THREE.PlaneGeometry {
  const { imageAspectRatio, meshResolution, meshDepth } = options;
  
  const width = Math.min(meshResolution, depthData.width);
  const height = Math.min(meshResolution, depthData.height);
  
  const geometry = new THREE.PlaneGeometry(
    imageAspectRatio,
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
    const z = depthValue * meshDepth;
    
    // Perspective scaling - nearer objects appear larger
    const scaleFactor = (4 - z) / 4;
    
    vertices[i] *= scaleFactor;     // X
    vertices[i + 1] *= scaleFactor; // Y
    vertices[i + 2] = z;            // Z

    depths[i / 3] = depthValue;
  }

  // Smoothing pass for jagged edges (like tiefling does)
  smoothGeometryEdges(vertices, depths, width, height);

  geometry.setAttribute('depth', new THREE.BufferAttribute(depths, 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

/**
 * Smooth jagged edges in geometry (from tiefling)
 */
export function smoothGeometryEdges(
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
 * Scale mesh to fit the container viewport
 */
export function scaleMeshToFit(
  mesh: THREE.Mesh,
  geometry: THREE.PlaneGeometry,
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number,
  cameraZ: number,
  cameraAspect: number
): void {
  const containerAspect = containerWidth / containerHeight;
  const fov = 45;
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * cameraZ;
  const visibleWidth = visibleHeight * cameraAspect;

  let scale: number;
  if (containerAspect > imageAspectRatio) {
    scale = visibleHeight / geometry.parameters.height;
  } else {
    scale = visibleWidth / geometry.parameters.width;
  }

  mesh.scale.set(scale, scale, 1);
}
