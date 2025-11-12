/**
 * Reusable Prompt Sections
 * Shared sections used across different prompt types
 */

/**
 * Composition layering instructions
 */
export function buildCompositionLayering(type: 'interior' | 'exterior'): string {
  return `COMPOSITION LAYERING (MANDATORY - Your output MUST include all three layers):

FOREGROUND (0-3 meters from camera):
- Immediate floor/ground surface details and texture
- Close architectural elements within arm's reach
- Near-side wall surfaces and details
- Anything you could touch from the camera position

MIDGROUND (3-10 meters):
- Navigation features (corridors, stairs, platforms, passages)
- Architectural details (machinery, panels, conduits, vents)
- Main structural elements
- Spatial transitions and connections

BACKGROUND (10+ meters / far distance):
- Where the space continues or ends
- Distant lighting and atmospheric effects
- Far end of corridor/chamber/passage
- Depth and spatial extent

CRITICAL: Each layer must be explicitly described SEPARATELY in your final output.
Do NOT combine or skip layers. Use clear spatial organization.`;
}

/**
 * Navigation guidance instructions
 */
export function buildNavigationGuidance(customFeatures?: string): string {
  if (customFeatures) {
    return `
CUSTOM NAVIGATION FEATURES (REQUIRED):
${customFeatures}

Integrate these specific features into the scene naturally.`;
  }

  return `
NAVIGATION & SPATIAL FEATURES (REQUIRED - include 3-4 SPECIFIC features):
Be CONCRETE and DETAILED. Avoid vague descriptions.

SPECIFICITY REQUIREMENTS:
✅ Good: "3-meter-wide side corridor branching left at 45 degrees, grated metal floor visible, warm orange glow from interior"
✅ Good: "Rusted metal ladder on right wall ascending to upper maintenance catwalk 6 meters up, with visible access hatch"
✅ Good: "Large circular vent opening ahead-right, 2m diameter, glowing interior visible with steam wisps"

❌ Bad: "narrow side passages"
❌ Bad: "some doorways"  
❌ Bad: "architectural details"

CHOOSE 3-4 SPECIFIC FEATURES:
- EXACT corridor/passage: Specify width, direction, angle, what's visible inside
- EXACT platform/walkway: Specify height, side (left/right), material, destination
- EXACT stairs/ladder: Specify location, direction (up/down), material, where it leads
- EXACT machinery/panel: Specify size, exact position, type, condition
- EXACT opening/vent: Specify size, shape, position, what's visible through it
- EXACT conduits/pipes: Specify diameter, routing path, material, quantity`;
}

/**
 * Navigable elements marking instructions
 */
export function buildNavigableElementsInstructions(): string {
  return `NAVIGABLE ELEMENTS MARKING (Required):
When describing navigable features in your scene, mark them inline using this natural format:

[description of element] (navigable: [type], [position])

TYPE OPTIONS:
- passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object

POSITION: Natural language describing side and layer
- Examples: "left side, midground" | "right wall, foreground" | "ahead, background" | "center, midground"

EXAMPLES:
✅ "A large circular vent, 2 meters in diameter, emits warm orange light from the right wall (navigable: opening, right wall, midground)."
✅ "To the left, a rusted metal ladder (navigable: ladder, left wall, midground) ascends along the curved wall."
✅ "A narrow corridor branches left at 30 degrees (navigable: corridor, left side, midground), with grated metal floor."
✅ "The corroded metal floor features drainage grates (navigable: object, center, foreground) with bioluminescent moss."

CRITICAL: Mark 3-4 navigable elements inline. These will later be extracted by an LLM to generate structured navigation data.
Make positions consistent with your description - if you write "left", mark it "left side" or "left wall", not "right".`;
}

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
 * Interior space rules section
 */
export function buildInteriorSpaceRules(entranceElement: string): string {
  return `CRITICAL - THIS IS AN INTERIOR SPACE:
- Show enclosed space with ceiling/roof overhead
- Interior lighting (ambient, artificial light, or light from windows/vents)
- Walls and interior architecture visible
- No open sky visible (unless through small windows/openings)
- Interior architecture must match the form of "${entranceElement}"`;
}

/**
 * Perspective and framing section
 */
export function buildPerspectiveFraming(): string {
  return `PERSPECTIVE & FRAMING:
- Camera position: Just past the entrance threshold (1-2 meters inside)
- View: Straight ahead showing the immediate entry view - what you first see when stepping in
- Composition: Entrance-view perspective with slight asymmetry for visual interest
  * Avoid extreme diagonal offset or purely symmetric tunnel view
  * Main space/path visible ahead with interesting details on sides for depth
- Camera: Wide-angle (24-35mm equivalent), eye-level
- The entrance is BEHIND the camera - do not show it`;
}

/**
 * Transformation rules for interior spaces
 */
export function buildTransformationRules(): string {
  return `HOW TO USE PARENT LOCATION DETAILS - CRITICAL TRANSFORMATION RULES:

✓ INCLUDE (transformed for interior):
- Materials & colors → Apply to interior surfaces, walls, ceiling, floor
- Architectural style → Adapt to interior architecture and structure
- Atmosphere & mood → Maintain similar emotional feel
- Lighting hints → Transform to interior light sources

✗ DO NOT INCLUDE (unless contextually logical):
- Exterior waterways/streams → Only if it's a logical interior feature (fountain, pool, drainage channel)
- Overgrown vegetation → Only sparse interior plants if contextually appropriate (hydroponics, garden room, etc.)
- Open landscapes → Replace with enclosed spatial elements
- Sky/outdoor ambient light → Transform to interior lighting sources (fixtures, windows, bioluminescence)
- Weather elements (mist, fog) → Only if it makes sense indoors (steam, smoke from vents, etc.)

REASONING TEST: For each parent element, ask "Would this logically exist inside this structure?"`;
}

/**
 * Requirements section
 */
export function buildRequirements(): string {
  return `REQUIREMENTS:
1. The entrance/threshold is BEHIND the camera - show the immediate entry view
2. Maintain consistent space type (interior OR exterior, no mixing)
3. Only include elements that would logically exist in this type of space (use transformation rules above)
4. Composition should be engaging with slight asymmetry, avoiding both extreme offset and pure symmetry
5. MUST include separate foreground, midground, and background descriptions`;
}

/**
 * CONDENSED VERSIONS - Token-optimized prompts
 */

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
  return `PERSPECTIVE: 1-2m inside entrance, straight ahead view. Wide-angle (24-35mm), eye-level. Entrance behind camera. Slight asymmetry, not tunnel-view.

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
  return `INTERIOR SPACE: Enclosed with ceiling, interior lighting, walls visible, no open sky (except small windows). Match form of "${entranceElement}"`;
}
