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
 * Camera positioned at distance to capture entire building/structure
 */
export const LOCATION_SHOT = {
  shot: 'wide establishing shot from significant distance, entire building or structure fully visible from base to roof/top, main subject occupies 40-60% of frame height with ample environmental context around all sides, camera far enough back that complete architectural form is captured, balanced composition showing full structure within surrounding environment',
  light: 'directional natural light with atmospheric haze, environmental motion (wind-blown mist, drifting clouds, shifting shadows), parallax depth through weather conditions',
  lens: '10-16mm ultra-wide lens, elevated perspective, expansive framing to capture entire structure',
  position: 'Camera positioned at distance where entire main subject fits comfortably in frame. Complete building/structure visible from ground to top. Environmental context visible on all sides. Creates establishing shot showing the full location.',
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
