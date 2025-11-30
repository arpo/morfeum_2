/**
 * Geometry utilities for WorldView
 * Handles depth map loading and geometry creation with baked depth
 */

import * as THREE from 'three';

export interface DepthGeometryOptions {
  imageAspectRatio: number;
  meshResolution: number;
  meshDepth: number;
}

/**
 * Load depth map as ImageData from URL
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
