/**
 * World Tree Composition Instructions
 * 
 * Camera and composition guidelines for different node types.
 * Each level has distinct visual identity for image generation.
 */

/**
 * Exterior composition instructions for location nodes
 */
export const EXTERIOR_COMPOSITION_INSTRUCTIONS = `
EXTERIOR BUILDING/LOCATION COMPOSITION (CRITICAL):

1. CAMERA POSITION
- Position at street level, slightly elevated (25-30° downward tilt)
- Building entrance visible but not dominating frame
- Ultra-wide view capturing building in environmental context
- Extensive surroundings visible (street, neighboring buildings, sky)

2. FACADE & ARCHITECTURAL DETAILS (MUST MATCH DNA)
- Building facade MUST reflect the architectural_tone exactly
- Include: signage, windows, doors, decorative elements, material textures
- Show how the building relates to its environment (set back, flush with street, etc.)
- Capture unique identifying features that make this building distinctive

3. COMPOSITION LAYERS
**Foreground:** Street surface, curb, immediate pavement with texture and detail.
MUST include 1 environmental element (e.g., "worn cobblestone with puddles reflecting neon signs").

**Midground:** The building facade as the main subject.
MUST show: entrance, signage, window displays, architectural details.
Position slightly off-center for dynamic composition.

**Background:** Sky, neighboring buildings, environmental context.
MAY include: distant landmarks, atmospheric elements (clouds, haze).

4. LIGHTING & ATMOSPHERE
- Match the DNA's colorsAndLighting and ambient fields
- Consider time of day implied by lighting (neon = night, natural = day)
- Environmental effects (mist, rain, heat shimmer) if mentioned in atmosphere

5. ASYMMETRIC COMPOSITION (CRITICAL)
- Building should NOT be perfectly centered
- Shoot at slight angle to show depth and dimension
- Include environmental asymmetry (more street visible on one side)
- Avoid: Perfectly frontal shots, centered subjects, bilateral symmetry
`;

/**
 * HOST composition instructions - VAST AERIAL/SATELLITE VIEW
 * Shows entire city/world from great height
 */
export const HOST_COMPOSITION_INSTRUCTIONS = `
AERIAL/PANORAMIC COMPOSITION (HOST - WORLD LEVEL):

1. CAMERA POSITION (CRITICAL - MUST BE AERIAL)
- AERIAL VIEW from GREAT HEIGHT (satellite, airplane, or mountaintop perspective)
- Camera positioned at SIGNIFICANT DISTANCE to capture the ENTIRE landscape/cityscape
- Oblique angle (30-60°) looking DOWN at the vast world below
- DO NOT use ground-level or street-level perspective
- Think: "viewing a city from an airplane window" or "satellite imagery"

2. SCALE & SCOPE (EPIC)
- Show the ENTIRE landscape/cityscape as a VAST PANORAMA
- Multiple districts, regions, or zones visible in one view
- Buildings and structures appear SMALL as part of the larger whole
- Distant horizons, sprawling terrain, water bodies, mountain ranges
- This should feel like looking at an entire WORLD, not just a neighborhood

3. COMPOSITION LAYERS
**Far Background:** Distant horizon line, sky dome, atmospheric haze
**Mid-Distance:** Major landmarks, terrain features, district boundaries, waterways
**Closer Elements:** Terrain texture, road networks, building clusters (but still distant)

4. ATMOSPHERE & DEPTH (CRITICAL)
- Strong ATMOSPHERIC PERSPECTIVE (distant areas hazier/lighter in color)
- Weather and sky are MAJOR composition elements (clouds, sun position)
- Time of day establishes world mood (golden hour, midday, dusk)
- May include: fog banks, cloud shadows on terrain, weather systems

5. ESTABLISHING SHOT REQUIREMENTS
- This is the "HERE IS THE WORLD" establishing shot
- Viewer should feel they are seeing an entire civilization/landscape
- Include enough detail to suggest stories and places to explore
- Avoid: close-ups, street-level details, individual people/characters
`;

/**
 * REGION composition instructions - DISTRICT/NEIGHBORHOOD OVERVIEW
 * Shows a specific district from elevated street-level view
 */
export const REGION_COMPOSITION_INSTRUCTIONS = `
DISTRICT OVERVIEW COMPOSITION (REGION - NEIGHBORHOOD LEVEL):

1. CAMERA POSITION (ELEVATED STREET-LEVEL)
- ELEVATED VIEW from rooftop, drone, or low-flying aircraft height
- Camera positioned CLOSER than host - showing a specific DISTRICT
- Oblique angle (35-50°) capturing neighborhood character
- Think: "viewing a neighborhood from a rooftop" or "drone footage of a district"

2. SCALE & SCOPE (DISTRICT)
- Show a SPECIFIC DISTRICT or NEIGHBORHOOD, not the entire city
- Individual buildings are RECOGNIZABLE and have character
- Streets, plazas, and local landmarks are visible
- This should feel like looking at "one part of a larger world"

3. COMPOSITION LAYERS
**Foreground:** Nearby rooftops, architectural details, local features
**Midground:** Main district character - streets, buildings, local landmarks
**Background:** Neighboring districts, distant skyline, horizon

4. ATMOSPHERE & CHARACTER
- Show the UNIQUE CHARACTER of this specific district
- Include: typical architecture, street patterns, district landmarks
- Lighting emphasizes district mood and time of day
- May include: local activity hints, district-specific elements

5. DISTRICT IDENTITY
- This shows "HERE IS THIS PART OF THE WORLD"
- Viewer should understand this district's character and purpose
- Include enough detail to suggest what happens in this area
- Maintain visual connection to larger world while focusing on district
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
