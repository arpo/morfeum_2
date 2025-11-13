/**
 * Reusable Prompt Sections (Condensed)
 * Token-optimized shared sections used across different prompt types
 * All sections use condensed versions for efficiency
 */

/**
 * Extract entrance element from decision reasoning
 */
export function extractEntranceElement(reasoning?: string): string {
  if (!reasoning) return 'this structure';
  
  // Example: "Creating interior niche based on Massive cylindrical structures (midground/background) in The Pollen Vents"
  // Extract: "Massive cylindrical structures"
  const match = reasoning.match(/based on (.+?) (?:\(|in)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return 'this structure';
}

/**
 * Parent structure analysis section for interior prompts
 */
export function buildParentStructureAnalysis(
  entranceElement: string,
  looks?: string
): string {
  return `PARENT STRUCTURE ANALYSIS (CRITICAL):
You entered through: "${entranceElement}"

${looks ? `Parent structure appearance: "${looks}"` : ''}

BEFORE creating the interior, analyze the parent structure's FORM:

1. SHAPE ANALYSIS
   What is the overall geometric form?
   - Circular/round → Interior must have circular floor plan
   - Rectangular/square → Interior must have straight walls with corners
   - Cylindrical/tubular → Interior must have curved walls (like inside a pipe)
   - Geodesic/faceted → Interior must show geometric framework
   - Irregular/organic → Interior must have natural, uneven surfaces

2. CEILING/ROOF ANALYSIS
   What type of ceiling would this structure have inside?
   - Domed roof → Domed ceiling overhead
   - Flat roof → Flat ceiling
   - Vaulted roof → Vaulted ceiling
   - Peaked/pitched roof → Angled ceiling following roof line
   - Geodesic dome → Visible geodesic framework overhead
   - Arched structure → Arched ceiling

3. SCALE & PROPORTION (CRITICAL)
   Extract dimensions from Spatial Layout if provided (e.g., "80-100m tall, 40m diameter")
   Apply proportional interior scale:
   
   - Compact/small (< 15m) → Intimate interior (3-5m ceilings, walls 3-8m apart)
   - Large/expansive (15-50m) → Spacious interior (8-15m ceilings, walls 10-20m apart)
   - Towering/colossal (> 50m) → Vast interior (20m+ ceilings, walls 20m+ apart, visible depth 40m+)
   
   MANDATORY for colossal structures (> 50m):
   - Specify ceiling height in meters (e.g., "vaulted ceiling soaring 40m overhead")
   - Specify wall distances (e.g., "walls stretching 25m to either side")
   - Include massive structural elements (e.g., "8m tall stone blocks," "towering 15m columns")
   - Emphasize depth and distance (e.g., "passage extending 50m into darkness")
   - Use scale-reinforcing language: "towering," "vast," "immense," "soaring," "colossal"
   
   If structure dimensions are provided (e.g., "80m tall"), interior ceiling should be 40-60% of total height.

CRITICAL: The interior architecture MUST directly reflect these analyzed characteristics.
You are literally INSIDE the structure described above.`;
}


/**
 * Condensed composition layering (40% shorter)
 */
export function buildCompositionLayeringCondensed(): string {
  return `COMPOSITION LAYERS (Required - describe all three):

CRITICAL: Check Spatial Layout for STRUCTURE FORM to determine composition priority:

VERTICAL STRUCTURE (towers, spires): PRIORITIZE UPWARD SPACE
- Foreground: Circular/curved floor plan with massive elements
- Midground: Vertical structural elements (columns, buttresses) with heights
- Background: PRIMARY FOCUS - Ceiling soaring overhead (specify height in meters), visible vertical shaft/levels extending upward

HORIZONTAL STRUCTURE (halls, corridors): PRIORITIZE EXTENDING DEPTH
- Foreground: Entry area floor texture
- Midground: Side features and structural elements
- Background: PRIMARY FOCUS - Passage extending into distance (specify depth in meters), far ceiling

WIDE STRUCTURE (domes, arenas): PRIORITIZE CIRCULAR EXPANSE
- Foreground: Curved floor plan details
- Midground: PRIMARY FOCUS - Circular wall distance (specify diameter), surrounding features
- Background: Domed ceiling overhead, far curved walls

For colossal spaces: Include dimensions (e.g., "ceiling 60m above," "passage 50m deep," "diameter 40m").`;
}

/**
 * Condensed navigation guidance (60% shorter)
 */
export function buildNavigationGuidanceCondensed(customFeatures?: string): string {
  if (customFeatures) {
    return `\nCUSTOM NAVIGATION FEATURES: ${customFeatures}`;
  }

  return `\nNAVIGATION FEATURES (include 3-4 specific features):
Be specific: "3m corridor left at 45°, metal grate, orange glow" not "narrow passage"
Examples: exact corridors (width, direction, angle), stairs/ladders (location, direction), openings (size, position)`;
}

/**
 * Condensed navigable elements instructions (70% shorter)
 */
export function buildNavigableElementsInstructionsCondensed(): string {
  return `NAVIGABLE MARKING: Mark 3-4 elements as [description] (navigable: type, position)
Types: passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object
Example: "Rusted ladder on left wall (navigable: ladder, left wall, midground)"`;
}

/**
 * Condensed perspective framing (50% shorter)
 */
export function buildPerspectiveFramingCondensed(): string {
  return `PERSPECTIVE: 1-2m inside entrance, straight ahead view. Wide-angle (24-35mm), eye-level. Entrance behind camera. Centered, balanced composition.

CRITICAL - ENTRANCE EXCLUSION:
The entrance/doorway/threshold is BEHIND the camera and OUT OF FRAME.
DO NOT describe, mention, or include the entrance in your output.
DO NOT write: "entrance visible," "doorway ahead," "through the entrance," "from the entrance"
Your description starts INSIDE the space, looking AWAY from where you entered.

Think: You've stepped inside and turned to face the interior. The entrance is now behind you, unseen.`;
}

/**
 * Condensed transformation rules (45% shorter)
 */
export function buildTransformationRulesCondensed(): string {
  return `TRANSFORM PARENT DETAILS FOR INTERIOR:
✓ Include: Materials/colors on interior surfaces, architectural style, atmosphere, lighting (as interior sources)
✗ Exclude: Exterior water/vegetation (unless logical), open landscapes, sky, weather elements
Test: "Would this exist inside this structure?"`;
}

/**
 * Condensed requirements (40% shorter)
 */
export function buildRequirementsCondensed(): string {
  return `REQUIREMENTS: Entrance behind camera, consistent space type, logical interior elements, slight asymmetry, separate layer descriptions`;
}

/**
 * Condensed interior space rules (45% shorter)
 */
export function buildInteriorSpaceRulesCondensed(entranceElement: string): string {
  return `INTERIOR SPACE: Fully enclosed with solid ceiling/roof above, walls surrounding, interior lighting. No open sky visible. Match form of "${entranceElement}"`;
}

export function buildCameraSpecificationsCondensed(): string {
  return `CAMERA SPECS: Include in final FLUX prompt based on space scale:
Small (<15m): 28-35mm lens, eye-level
Medium (15-50m): 20-28mm lens, slight upward tilt
Colossal (>50m): 14-20mm ultra-wide, upward tilt, deep depth of field, emphasize perspective`;
}

/**
 * EXTERIOR-SPECIFIC SECTIONS
 * These versions are for open-air niche spaces (no ceiling, sky visible)
 */

/**
 * Parent structure analysis for EXTERIOR open-air spaces
 */
export function buildParentStructureAnalysisExterior(
  entranceElement: string,
  looks?: string
): string {
  return `PARENT LOCATION ANALYSIS (CRITICAL):
You entered through: "${entranceElement}"

${looks ? `Parent location appearance: "${looks}"` : ''}

BEFORE creating the open-air niche, analyze the parent location's characteristics:

1. GROUND PLAN ANALYSIS
   What is the overall layout?
   - Circular/round → Niche has circular ground plan
   - Rectangular/square → Niche has straight edges with corners
   - Linear/pathway → Niche follows linear path structure
   - Organic/irregular → Niche has natural, flowing boundaries
   - Courtyard/plaza → Niche is open central space

2. SKY & OVERHEAD ANALYSIS
   - Sky is VISIBLE above (no ceiling)
   - Natural daylight or atmospheric lighting
   - Weather appropriate to location (if any)
   - Open-air atmosphere

3. SCALE & PROPORTION (CRITICAL)
   Extract dimensions from Spatial Layout if provided (e.g., "40m wide courtyard")
   Apply proportional exterior scale:
   
   - Intimate (< 15m) → Small niche (3-5m across, personal scale)
   - Spacious (15-50m) → Large niche (10-20m across, public scale)
   - Expansive (> 50m) → Vast niche (20m+ across, monumental scale)
   
   MANDATORY for expansive spaces (> 50m):
   - Specify ground dimensions (e.g., "courtyard 40m across")
   - Include scale elements (e.g., "10m tall trees," "5m wide pathways")
   - Emphasize openness and distance
   - Use scale-reinforcing language: "expansive," "open," "spacious," "sweeping"

CRITICAL: The open-air niche MUST directly reflect these analyzed characteristics.
You are literally WITHIN the open-air space, with sky visible above.`;
}

/**
 * Exterior transformation rules
 */
export function buildTransformationRulesCondensedExterior(): string {
  return `TRANSFORM PARENT DETAILS FOR EXTERIOR NICHE:
✓ Include: Materials/colors on ground surfaces, architectural elements, atmosphere, natural/ambient lighting, vegetation, weather
✗ Exclude: Enclosed ceilings, interior light sources, roof structures (unless as boundary elements)
Test: "Would this exist in an open-air space within this location?"`;
}

/**
 * Exterior composition layering - focuses on horizontal expanse and sky
 */
export function buildCompositionLayeringCondensedExterior(): string {
  return `COMPOSITION LAYERS (Required - describe all three):

CRITICAL: Open-air niche composition with sky visible:

GROUND-LEVEL FOCUS: PRIORITIZE HORIZONTAL EXPANSE
- Foreground: Ground surface details (paving, grass, terrain) at feet
- Midground: PRIMARY FOCUS - Boundary elements (walls, vegetation, structures), horizontal extent of space
- Background: Sky visible above, distant features, atmospheric depth

For expansive spaces: Include ground dimensions (e.g., "courtyard 40m across," "pathway 20m long").`;
}
