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
  /** Camera perspective guidance for LLM prompt generation */
  perspectiveGuidance: string;
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
        composition: HOST_COMPOSITION_INSTRUCTIONS,
        perspectiveGuidance: `CAMERA PERSPECTIVE: AERIAL VIEW from satellite/airplane height (30-60° down angle).
All layers must be described AS SEEN FROM HIGH ABOVE - buildings appear small, streets are distant lines.
NO street-level details, NO close-up textures, NO objects "at your feet".`
      };
    
    case 'region':
      return {
        shot: OVERVIEW_SHOT.shot,
        lens: OVERVIEW_SHOT.lens,
        light: OVERVIEW_SHOT.light,
        composition: REGION_COMPOSITION_INSTRUCTIONS,
        perspectiveGuidance: `CAMERA PERSPECTIVE: ELEVATED VIEW from rooftop/drone height (35-50° down angle).
All layers must be described AS SEEN FROM ABOVE - rooftops visible, streets seen from height.
NO street-level details, NO close-up ground textures.`
      };
    
    case 'location':
      if (spaceType === 'interior') {
        return {
          shot: NICHE_SHOT_INTERIOR.shot,
          lens: NICHE_SHOT_INTERIOR.lens,
          light: NICHE_SHOT_INTERIOR.light,
          composition: 'Interior photography, room composition showing space character, eye-level perspective',
          perspectiveGuidance: `CAMERA PERSPECTIVE: INTERIOR EYE-LEVEL view inside the space.
Describe what you see standing inside the room/space.`
        };
      }
      return {
        shot: LOCATION_SHOT.shot,
        lens: LOCATION_SHOT.lens,
        light: LOCATION_SHOT.light,
        composition: EXTERIOR_COMPOSITION_INSTRUCTIONS,
        perspectiveGuidance: `CAMERA PERSPECTIVE: STREET-LEVEL view (25-30° tilt up).
Describe what you see standing on the street looking at the OUTSIDE/EXTERIOR of the building/location.
This is an EXTERIOR shot - show the building facade, entrance, surroundings. NOT inside.`
      };
    
    default:
      return {
        shot: LOCATION_SHOT.shot,
        lens: LOCATION_SHOT.lens,
        light: LOCATION_SHOT.light,
        composition: EXTERIOR_COMPOSITION_INSTRUCTIONS,
        perspectiveGuidance: `CAMERA PERSPECTIVE: STREET-LEVEL view (25-30° tilt up).
Describe what you see standing on the street looking at the OUTSIDE/EXTERIOR of the building/location.`
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
