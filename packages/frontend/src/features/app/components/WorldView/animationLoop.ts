/**
 * Animation Loop for WorldView
 * Handles the main render loop and frame updates
 */

import * as THREE from 'three';
import { CameraConfig, getCameraMovementPosition, smoothToTarget } from './cameraAnimation';
import { updateStereoUniforms, renderStereo, StereoState } from './stereoRenderer';
import type { DisplayMode } from './WorldViewRenderer';

export interface AnimationState {
  targetX: number;
  targetY: number;
  focus: number;
  easing: number;
  displayMode: DisplayMode;
  mouseXOffset: number;
}

export interface ScissorDimensions {
  scissorX: number;
  scissorY: number;
  scissorWidth: number;
  scissorHeight: number;
}

/**
 * Update camera position based on movement
 */
export function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  movement: { posX: number; posY: number; z: number; roll: number },
  baseCameraZ: number
): void {
  camera.position.x = movement.posX;
  camera.position.y = movement.posY;
  camera.position.z = baseCameraZ + movement.z;
  camera.lookAt(0, 0, 0);
  // Apply roll (Z rotation) after lookAt to create head tilt effect
  camera.rotation.z = movement.roll;
}

/**
 * Update shader uniforms
 */
export function updateMaterialUniforms(
  material: THREE.ShaderMaterial | null,
  targetX: number,
  targetY: number,
  focus: number
): void {
  if (!material) return;
  material.uniforms.mouseDelta.value.set(targetX, -targetY);
  material.uniforms.focus.value = focus;
}

/**
 * Render mono (single view) mode
 */
export function renderMono(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  containerWidth: number,
  containerHeight: number,
  scissor: ScissorDimensions
): void {
  if (scissor.scissorWidth > 0 && scissor.scissorHeight > 0) {
    renderer.setScissorTest(true);
    renderer.setScissor(scissor.scissorX, scissor.scissorY, scissor.scissorWidth, scissor.scissorHeight);
    renderer.setViewport(0, 0, containerWidth, containerHeight);
    renderer.render(scene, camera);
  }
}

/**
 * Process a single animation frame
 */
export function processAnimationFrame(
  state: AnimationState,
  cameraConfig: CameraConfig,
  camera: THREE.PerspectiveCamera,
  material: THREE.ShaderMaterial | null,
  stereoState: StereoState
): { targetX: number; targetY: number } {
  // Get camera movement (zeros for 2D mode)
  const movement = state.displayMode === '2d' 
    ? { x: 0, y: 0, z: 0, roll: 0, posX: 0, posY: 0 } 
    : getCameraMovementPosition(cameraConfig);
  
  // Update camera position for tilt effect
  updateCameraPosition(camera, movement, cameraConfig.baseCameraZ);
  
  // Smooth easing toward target
  const smoothed = smoothToTarget(
    state.targetX, 
    state.targetY, 
    movement.x, 
    movement.y, 
    state.focus, 
    state.easing
  );

  // Update shader uniforms
  updateMaterialUniforms(material, smoothed.targetX, smoothed.targetY, state.focus);

  // Update stereo uniforms
  updateStereoUniforms(
    stereoState.material2,
    smoothed.targetX,
    smoothed.targetY,
    state.mouseXOffset,
    state.focus
  );

  return smoothed;
}

/**
 * Render frame based on display mode
 */
export function renderFrame(
  displayMode: DisplayMode,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  stereoScene: THREE.Scene | null,
  camera: THREE.PerspectiveCamera,
  containerWidth: number,
  containerHeight: number,
  scissor: ScissorDimensions
): void {
  if (displayMode === 'hsbs') {
    renderStereo(renderer, scene, stereoScene, camera, containerWidth, containerHeight);
  } else {
    renderMono(renderer, scene, camera, containerWidth, containerHeight, scissor);
  }
}
