/**
 * Crossfade Manager for WorldView
 * Handles smooth transitions between images
 */

import * as THREE from 'three';

export interface CrossfadeState {
  mesh: THREE.Mesh | null;
  material: THREE.ShaderMaterial | null;
  progress: number;
  duration: number;
  startTime: number;
  isActive: boolean;
}

export function createCrossfadeState(): CrossfadeState {
  return {
    mesh: null,
    material: null,
    progress: 1,
    duration: 0,
    startTime: 0,
    isActive: false
  };
}

/**
 * Start a crossfade transition
 */
export function startCrossfade(
  state: CrossfadeState,
  oldMesh: THREE.Mesh,
  oldMaterial: THREE.ShaderMaterial,
  duration: number
): CrossfadeState {
  // Store old mesh as crossfade source
  oldMaterial.transparent = true;
  oldMaterial.needsUpdate = true;

  return {
    mesh: oldMesh,
    material: oldMaterial,
    progress: 0,
    duration,
    startTime: performance.now(),
    isActive: true
  };
}

/**
 * Update crossfade animation
 * Uses "fade over" approach: old mesh stays at full opacity while new mesh fades IN over it.
 * This prevents the "fade through gray" effect that happens with dual opacity fading.
 * @returns Updated state and whether crossfade is complete
 */
export function updateCrossfade(
  state: CrossfadeState,
  newMaterial: THREE.ShaderMaterial | null
): { state: CrossfadeState; complete: boolean } {
  if (!state.isActive) {
    return { state, complete: false };
  }

  const elapsed = (performance.now() - state.startTime) / 1000;
  const progress = Math.min(elapsed / state.duration, 1);

  // Smooth easing (ease-in-out)
  const eased = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  // Keep old mesh at FULL OPACITY - it acts as the background
  // Only fade IN the new mesh over it - this creates a true crossfade
  if (state.material?.uniforms?.opacity) {
    state.material.uniforms.opacity.value = 1.0; // Keep at full opacity
  }
  if (newMaterial?.uniforms?.opacity) {
    newMaterial.uniforms.opacity.value = eased; // Fade in new image over old
  }

  const complete = progress >= 1;

  return {
    state: { ...state, progress },
    complete
  };
}

/**
 * Cleanup crossfade resources
 */
export function cleanupCrossfade(
  state: CrossfadeState,
  scene: THREE.Scene,
  newMaterial: THREE.ShaderMaterial | null
): CrossfadeState {
  if (state.mesh) {
    scene.remove(state.mesh);
    state.mesh.geometry.dispose();
  }
  if (state.material) {
    state.material.dispose();
  }
  if (newMaterial) {
    newMaterial.transparent = false;
    newMaterial.uniforms.opacity.value = 1;
    newMaterial.needsUpdate = true;
  }

  return createCrossfadeState();
}

/**
 * Prepare new material for fade-in (start at 0 opacity)
 */
export function prepareNewMaterialForFadeIn(material: THREE.ShaderMaterial): void {
  material.transparent = true;
  material.uniforms.opacity.value = 0;
  material.needsUpdate = true;
}
