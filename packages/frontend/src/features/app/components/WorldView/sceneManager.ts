import type { ParticleSystem } from './effects/particles';
import type { PostProcessorSystem, ColorEffects } from './effects/postprocessors';
import { getScenePreset, ScenePresetConfig } from './effects/scenes';

export interface SceneState {
  currentScene: ScenePresetConfig | null;
  timers: { windGust: number; lightning: number };
}

/**
 * Create initial scene state
 */
export function createSceneState(): SceneState {
  return {
    currentScene: null,
    timers: { windGust: 0, lightning: 0 }
  };
}

/**
 * Apply a scene preset to particle and post-processor systems
 */
export function applyScenePreset(
  sceneName: string,
  particleSystem: ParticleSystem | null,
  postProcessor: PostProcessorSystem | null,
  initParticles: (preset: string) => void,
  ensurePostProcessor: () => void
): ScenePresetConfig | null {
  const scene = getScenePreset(sceneName);
  if (!scene) return null;

  // Apply particle preset
  if (scene.particles.enabled) {
    if (particleSystem) {
      particleSystem.setPreset(scene.particles.preset);
      particleSystem.setEnabled(true);
    } else {
      initParticles(scene.particles.preset);
    }
  } else {
    particleSystem?.setEnabled(false);
  }

  // Apply displacement effect
  ensurePostProcessor();
  if (scene.displacement.enabled && scene.displacement.preset !== 'none') {
    postProcessor?.setPreset(scene.displacement.preset);
    postProcessor?.setEnabled(true);
    if (scene.displacement.intensity !== undefined) {
      postProcessor?.setIntensity(scene.displacement.intensity);
    }
  } else {
    // Keep post-processor for color effects but disable displacement
    postProcessor?.setIntensity(0);
  }

  // Apply color effects
  if (scene.colorEffects) {
    postProcessor?.setColorEffects(scene.colorEffects);
  }

  return scene;
}

/**
 * Clear current scene and reset effects
 */
export function clearScenePreset(
  postProcessor: PostProcessorSystem | null
): SceneState {
  postProcessor?.resetColorEffects();
  postProcessor?.setIntensity(0);
  return createSceneState();
}

/**
 * Update scene-specific effects (wind gusts, lightning)
 */
export function updateSceneEffects(
  deltaTime: number,
  sceneState: SceneState,
  particleSystem: ParticleSystem | null,
  postProcessor: PostProcessorSystem | null
): SceneState {
  if (!sceneState.currentScene) return sceneState;

  const newTimers = { ...sceneState.timers };

  // Handle random wind gusts
  if (sceneState.currentScene.windGust?.enabled) {
    newTimers.windGust += deltaTime;
    const interval = sceneState.currentScene.windGust.interval;

    // Add randomness to interval (±30%)
    const variance = interval * 0.3;
    const nextGust = interval + (Math.random() - 0.5) * 2 * variance;

    if (newTimers.windGust >= nextGust && !particleSystem?.isWindGustActive()) {
      particleSystem?.triggerWindGust(
        sceneState.currentScene.windGust.strengthX,
        sceneState.currentScene.windGust.strengthY,
        sceneState.currentScene.windGust.duration
      );
      newTimers.windGust = 0;
    }
  }

  // Handle random lightning
  if (sceneState.currentScene.lightning?.enabled) {
    newTimers.lightning += deltaTime;
    const interval = sceneState.currentScene.lightning.interval;

    // Add randomness to interval (±50%)
    const variance = interval * 0.5;
    const nextFlash = interval + (Math.random() - 0.5) * 2 * variance;

    if (newTimers.lightning >= nextFlash) {
      postProcessor?.triggerLightning(sceneState.currentScene.lightning.intensity);
      newTimers.lightning = 0;
    }
  }

  return { ...sceneState, timers: newTimers };
}

/**
 * Color effect wrapper methods for WorldViewRenderer API
 */
export const colorEffectMethods = {
  setVignette: (postProcessor: PostProcessorSystem | null, strength: number) => {
    postProcessor?.setVignette(strength);
  },

  setTint: (postProcessor: PostProcessorSystem | null, r: number, g: number, b: number, strength: number = 1) => {
    postProcessor?.setTint(r, g, b, strength);
  },

  setBloom: (postProcessor: PostProcessorSystem | null, strength: number) => {
    postProcessor?.setBloom(strength);
  },

  triggerLightning: (postProcessor: PostProcessorSystem | null, intensity: number = 1) => {
    postProcessor?.triggerLightning(intensity);
  },

  setDesaturate: (postProcessor: PostProcessorSystem | null, amount: number) => {
    postProcessor?.setDesaturate(amount);
  },

  setColorEffects: (postProcessor: PostProcessorSystem | null, effects: Partial<ColorEffects>) => {
    postProcessor?.setColorEffects(effects);
  },

  resetColorEffects: (postProcessor: PostProcessorSystem | null) => {
    postProcessor?.resetColorEffects();
  }
};
