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
 * Interior camera specifications by space scale
 */
export const NICHE_CAMERA_SPECS = {
  SMALL: '28-35mm lens, eye-level, centered perspective',
  MEDIUM: '20-28mm lens, eye-level to slight upward tilt (5°), centered',
  COLOSSAL: '14-20mm ultra-wide lens, upward tilt (10-15°), centered perspective',
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
export const LOCATION_SHOT = {
  shot: 'camera positioned on approach path with elevated perspective, 25-30° downward tilt, ultra-wide view capturing entrance within broader environmental context, entrance visible but not dominating frame, extensive surroundings visible, layered depth from immediate foreground through distant background, balanced composition showing full architectural context',
  light: 'directional natural light with atmospheric haze, environmental motion (wind-blown mist, drifting clouds, shifting shadows), parallax depth through weather conditions',
  lens: '12-24mm ultra-wide lens, elevated perspective, expansive framing',
  position: 'Camera on approach path, facing entrance from elevated position (25-30° downward angle). Entrance visible within wide environmental context. Ultra-wide perspective captures extensive surroundings while maintaining entrance visibility. Creates alignment for smooth zoom-in transition to interior view.',
};

/**
 * First-person INTERIOR shot (Niche)
 * Inside enclosed spaces
 */
export const NICHE_SHOT_INTERIOR = {
  shot: 'eye-level, centered view into space, architectural elements frame the view, layered depth, balanced composition',
  light: 'interior lighting with atmospheric depth, environmental motion (steam, dust motes, flickering sources), mixed lighting temperature creating visual texture',
  lens: NICHE_CAMERA_SPECS.SMALL
};

/**
 * First-person EXTERIOR shot (Niche)
 * Inside enclosed spaces
 */
export const NICHE_SHOT_EXTERIOR = {
  shot: 'eye-level, centered view into space, architectural elements frame the view, layered depth, balanced composition',
  light: 'interior lighting with atmospheric depth, environmental motion (steam, dust motes, flickering sources), mixed lighting temperature creating visual texture',
  lens: NICHE_CAMERA_SPECS.SMALL
};


// Niche camera
export const NICHE_CAMERA = `
[CAMERA:] Off center one-point perspective
[LENS:] 18mm f/4, ultra-wide
`;


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
    return NICHE_CAMERA_SPECS.SMALL;
  } else if (ceilingHeight < 50) {
    return NICHE_CAMERA_SPECS.MEDIUM;
  } else {
    return NICHE_CAMERA_SPECS.COLOSSAL;
  }
}
