/**
 * V2 Camera Settings
 * 
 * Unified camera configuration for /DISPLAY command.
 * Re-exports and extends existing camera settings.
 */

import { 
  OVERVIEW_SHOT, 
  LOCATION_SHOT, 
  NICHE_SHOT_INTERIOR,
  NICHE_SHOT_EXTERIOR,
  ALIGNMENT 
} from '../../engine/generation/prompts/shared/cameraConfig';

import { 
  HOST_COMPOSITION_INSTRUCTIONS,
  REGION_COMPOSITION_INSTRUCTIONS,
  EXTERIOR_COMPOSITION_INSTRUCTIONS 
} from '../../engine/generation/prompts/locations/worldTree/compositionInstructions';

export type V2NodeType = 'host' | 'region' | 'location';

export interface V2CameraConfig {
  shot: string;
  lens: string;
  light: string;
  composition: string;
}

/**
 * Get camera configuration for V2 node types
 */
export function getV2CameraConfig(nodeType: V2NodeType, spaceType?: 'exterior' | 'interior'): V2CameraConfig {
  switch (nodeType) {
    case 'host':
      return {
        shot: OVERVIEW_SHOT.shot,
        lens: OVERVIEW_SHOT.lens,
        light: OVERVIEW_SHOT.light,
        composition: HOST_COMPOSITION_INSTRUCTIONS
      };
    
    case 'region':
      return {
        shot: OVERVIEW_SHOT.shot,
        lens: OVERVIEW_SHOT.lens,
        light: OVERVIEW_SHOT.light,
        composition: REGION_COMPOSITION_INSTRUCTIONS
      };
    
    case 'location':
      if (spaceType === 'interior') {
        return {
          shot: NICHE_SHOT_INTERIOR.shot,
          lens: NICHE_SHOT_INTERIOR.lens,
          light: NICHE_SHOT_INTERIOR.light,
          composition: 'Interior photography, room composition showing space character, eye-level perspective'
        };
      }
      return {
        shot: LOCATION_SHOT.shot,
        lens: LOCATION_SHOT.lens,
        light: LOCATION_SHOT.light,
        composition: EXTERIOR_COMPOSITION_INSTRUCTIONS
      };
    
    default:
      return {
        shot: LOCATION_SHOT.shot,
        lens: LOCATION_SHOT.lens,
        light: LOCATION_SHOT.light,
        composition: EXTERIOR_COMPOSITION_INSTRUCTIONS
      };
  }
}

/**
 * Format camera config as prompt string
 */
export function formatCameraPrompt(config: V2CameraConfig): string {
  return `[CAMERA:] ${config.shot}
[LENS:] ${config.lens}
[LIGHT:] ${config.light}
[ALIGNMENT:] ${ALIGNMENT.CENTERED}`;
}

// Re-export for convenience
export { ALIGNMENT };
