/**
 * World Tree Composition Instructions - Optimized
 * Camera and composition guidelines for different node types.
 */

/**
 * HOST: Aerial/satellite view of entire city/world
 */
export const HOST_COMPOSITION_INSTRUCTIONS = `
AERIAL COMPOSITION (HOST - WORLD LEVEL):

CAMERA: Aerial 30-60°↓, satellite/airplane height, vast panorama
- Show ENTIRE landscape/cityscape from great distance
- Buildings appear SMALL as part of larger whole
- NOT street-level, NOT close-ups

LAYERS:
- Far: horizon, sky dome, atmospheric haze
- Mid: landmarks, terrain, district boundaries, waterways
- Close: terrain texture, road networks, building clusters (still distant)

ATMOSPHERE:
- Strong atmospheric perspective (distant=hazier)
- Weather/sky as MAJOR elements
- Time of day establishes world mood

GOAL: \"HERE IS THE WORLD\" establishing shot - viewer sees entire civilization/landscape
`;

/**
 * REGION: District/neighborhood overview
 */
export const REGION_COMPOSITION_INSTRUCTIONS = `
DISTRICT COMPOSITION (REGION - NEIGHBORHOOD LEVEL):

CAMERA: Elevated 35-50°, rooftop/drone height, district focus
- Show specific DISTRICT, not entire city
- Individual buildings RECOGNIZABLE
- Streets, plazas, landmarks visible

LAYERS:
- Foreground: nearby rooftops, architectural details
- Midground: streets, buildings, local landmarks
- Background: neighboring districts, distant skyline

ATMOSPHERE:
- Show UNIQUE CHARACTER of this district
- Typical architecture, street patterns
- District mood and activity hints

GOAL: \"HERE IS THIS PART\" - viewer understands district character and purpose
`;

/**
 * LOCATION/NICHE: Building exterior or interior
 */
export const EXTERIOR_COMPOSITION_INSTRUCTIONS = `
EXTERIOR COMPOSITION (LOCATION):

CAMERA: Street level, 25-30°↓ tilt, building in environmental context
- Entrance visible but not dominating
- Ultra-wide capturing surroundings

FACADE (MUST MATCH architectural_tone):
- Signage, windows, doors, decorative elements, materials
- Unique identifying features
- Relationship to environment

LAYERS:
- Foreground: Street surface, curb, 1 environmental element (e.g., \"cobblestone with puddles\")
- Midground: Building facade (main subject, off-center)
- Background: Sky, neighboring buildings

COMPOSITION:
- Building NOT perfectly centered
- Slight angle for depth
- Environmental asymmetry
- Avoid: frontal shots, centered subjects, bilateral symmetry
`;

/**
 * Get composition instructions based on node type
 */
export function getCompositionInstructions(
  nodeType: 'host' | 'region' | 'location' | 'niche'
): string {
  switch (nodeType) {
    case 'host':
      return HOST_COMPOSITION_INSTRUCTIONS;
    case 'region':
      return REGION_COMPOSITION_INSTRUCTIONS;
    case 'location':
    case 'niche':
    default:
      return EXTERIOR_COMPOSITION_INSTRUCTIONS;
  }
}
