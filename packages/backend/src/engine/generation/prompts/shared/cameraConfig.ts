/**
 * Centralized Camera Configuration
 * Single source of truth for camera angles across all image generation
 * 
 * Camera angles are CENTERED and ALIGNED for smooth transitions between scenes
 */

/**
 * Camera alignment philosophy
 */
export const ALIGNMENT = {
  CENTERED: 'centered, straight-ahead composition',
  DESCRIPTION: 'Camera is centered and aligned straight for consistent transitions between scenes',
};

/**
 * Overview shot configuration (Host/Region)
 * Aerial/elevated perspective
 */
export const OVERVIEW_SHOT = {
  shot: 'elevated oblique, aerial 45° tilt, wide composition with centered framing, layered depth with foreground elements',
  light: 'diffused key with parallax through haze, environmental motion (mist, wind, smoke)',
  lens: '16-35mm wide-angle lens, centered perspective',
};

/**
 * First-person EXTERIOR shot (Location)
 * Ground-level outdoor perspective
 * Camera positioned directly facing entrance for smooth transitions
 */
export const EXTERIOR_SHOT = {
  shot: 'camera positioned directly in front of entrance/building, eye-level, straight-on view facing the entrance, centered composition with entrance as focal point, natural foreground elements framing the approach, layered depth showing near/mid/far, balanced framing',
  light: 'directional natural light with atmospheric haze, environmental motion (wind-blown mist, drifting clouds, shifting shadows), parallax depth through weather conditions',
  lens: '24-35mm wide-angle lens, eye-level, centered on entrance',
  position: 'Camera on approach path, directly facing entrance at eye-level. Entrance/doorway/building facade centered in frame as main focal point. Creates alignment for smooth zoom-in transition to interior view.',
};

/**
 * First-person INTERIOR shot (Niche)
 * Inside enclosed spaces
 */
export const INTERIOR_SHOT = {
  shot: 'eye-level, centered view into space, architectural elements frame the view, layered depth, balanced composition',
  light: 'interior lighting with atmospheric depth, environmental motion (steam, dust motes, flickering sources), mixed lighting temperature creating visual texture',
  lens: 'varies by space scale - see INTERIOR_CAMERA_SPECS',
};

/**
 * Interior camera specifications by space scale
 */
export const INTERIOR_CAMERA_SPECS = {
  SMALL: '28-35mm lens, eye-level, centered perspective',
  MEDIUM: '20-28mm lens, eye-level to slight upward tilt (5°), centered',
  COLOSSAL: '14-20mm ultra-wide lens, upward tilt (10-15°), centered perspective',
};

/**
 * Depth of field settings
 */
export const DEPTH_OF_FIELD = {
  STANDARD: 'moderate depth of field',
  DEEP: 'deep depth of field maintaining sharpness from foreground to background',
};

/**
 * Helper function to get camera specs for interior spaces
 */
export function getInteriorCameraSpec(ceilingHeight: number): string {
  if (ceilingHeight < 15) {
    return INTERIOR_CAMERA_SPECS.SMALL;
  } else if (ceilingHeight < 50) {
    return INTERIOR_CAMERA_SPECS.MEDIUM;
  } else {
    return INTERIOR_CAMERA_SPECS.COLOSSAL;
  }
}
