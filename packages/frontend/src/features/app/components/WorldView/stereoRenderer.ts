/**
 * Stereo Rendering for WorldView
 * Handles HSBS (Half Side-By-Side) stereo mode for 3D displays
 */

import * as THREE from 'three';

export interface StereoState {
  scene2: THREE.Scene | null;
  mesh2: THREE.Mesh | null;
  material2: THREE.ShaderMaterial | null;
}

/**
 * Create initial stereo state
 */
export function createStereoState(): StereoState {
  return {
    scene2: null,
    mesh2: null,
    material2: null
  };
}

/**
 * Setup second scene for stereo rendering
 * Clones the main mesh for the right eye view
 */
export function setupStereoScene(
  mainMesh: THREE.Mesh | null,
  mainMaterial: THREE.ShaderMaterial | null,
  state: StereoState
): StereoState {
  // Always clean up and recreate to ensure sync with main mesh
  const cleanedState = cleanupStereoScene(state);
  
  if (!mainMesh || !mainMaterial) {
    return cleanedState;
  }
  
  const scene2 = new THREE.Scene();
  scene2.background = null;
  
  // Clone the mesh for the right eye view
  const geometry = mainMesh.geometry.clone();
  const material2 = mainMaterial.clone();
  const mesh2 = new THREE.Mesh(geometry, material2);
  mesh2.scale.copy(mainMesh.scale);
  scene2.add(mesh2);
  
  return {
    scene2,
    mesh2,
    material2
  };
}

/**
 * Cleanup stereo scene resources
 */
export function cleanupStereoScene(state: StereoState): StereoState {
  if (state.mesh2) {
    state.scene2?.remove(state.mesh2);
    state.mesh2.geometry.dispose();
  }
  if (state.material2) {
    state.material2.dispose();
  }
  
  return {
    scene2: null,
    mesh2: null,
    material2: null
  };
}

/**
 * Update stereo material uniforms for right eye offset
 */
export function updateStereoUniforms(
  material2: THREE.ShaderMaterial | null,
  targetX: number,
  targetY: number,
  mouseXOffset: number,
  focus: number
): void {
  if (!material2) return;
  
  // Right eye has offset for stereo separation
  material2.uniforms.mouseDelta.value.set(
    targetX + mouseXOffset * 2, 
    -targetY
  );
  material2.uniforms.focus.value = focus;
}

/**
 * Render stereo side-by-side (HSBS)
 */
export function renderStereo(
  renderer: THREE.WebGLRenderer,
  mainScene: THREE.Scene,
  stereoScene: THREE.Scene | null,
  camera: THREE.PerspectiveCamera,
  containerWidth: number,
  containerHeight: number
): void {
  const halfWidth = containerWidth / 2;

  renderer.setScissorTest(true);

  // Left eye - left half of screen
  renderer.setViewport(0, 0, halfWidth, containerHeight);
  renderer.setScissor(0, 0, halfWidth, containerHeight);
  renderer.render(mainScene, camera);

  // Right eye - right half of screen
  if (stereoScene) {
    renderer.setViewport(halfWidth, 0, halfWidth, containerHeight);
    renderer.setScissor(halfWidth, 0, halfWidth, containerHeight);
    renderer.render(stereoScene, camera);
  }
}
