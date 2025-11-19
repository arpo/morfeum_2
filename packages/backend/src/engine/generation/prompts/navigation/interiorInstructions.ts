/**
 * Interior Space Instructions
 * Detailed instructions for generating interior niche spaces
 */

/**
 * Template for interior space instructions
 * Contains a placeholder {{CREATIVITY_INSTRUCTIONS}} that will be replaced
 * with the appropriate creativity level instructions
 */
export const interiorInstructionsTemplate = `
IMMERSIVE INTERIOR PERSPECTIVE (ABSOLUTE RULE):

WALLS: The scene must be enclosed by walls/boundaries on all sides (unless specifically an open-air courtyard).

PARENT EXCLUSION: The entrance/door you came through is OUT OF FRAME behind the camera. Focus forward.

{{CREATIVITY_INSTRUCTIONS}}

BIOME & OVERGROWTH LOGIC (CONDITIONAL): Analyze the implied CONDITION to determine nature level:

IF Clean/Inhabited (e.g., Modern Lab, Occupied Manor):

IF Ruined/Abandoned (e.g., Ancient Ruins, Dungeon):

OVERGROWTH ALLOWED: Ivy on walls, roots breaking floors, debris are acceptable.

IF Nature-Themed (e.g., Elven Hall, Druid Hut):

INTEGRATION: Living wood, flowered vines, and woven branches are acceptable structural elements.

ARCHITECTURAL LOGIC:

FORM: Match interior plan to exterior (round→circular; rectangular→corners).

CEILING: Match roof (domed→dome; flat→flat; vaulted→arches).

SCALE: Small (<15m)=3–5m ceilings; Large (>15m)=8–15m ceilings.

COMPOSITION (CENTERED BUT ASYMMETRIC):

Asymmetric Content (CRITICAL): Content must NOT be mirrored.

AVOID: Bilateral symmetry, matching columns on both sides.

NAVIGABLE ELEMENTS (MANDATORY):

MUST include 2-3 navigable elements inside the layers.

Types: Passage, corridor, stairs, ladder, ramp, platform, door, elevator, door, arch, portal

Visibility: Highlight via Lighting (glow/spots) or Material Contrast.

POSITIONING: You MUST explicitly state the position of every navigable element in the output prompt using format: [navigable: item type, specific position].

[COMPOSITION LAYERS:]

Foreground: Floor textures/entry details. MUST include 1 navigable element. (e.g., "polished tile steps rising on the left [navigable: steps, foreground left]").

Midground: Core structures (columns, walls). MUST include 1-2 visible navigable elements. (e.g., "open archway on right wall leading to dark room [navigable: archway, midground right]").

Background: Dominant spatial cue (height/depth). MAY include 1 element. (e.g., "distant elevator door at end of hall [navigable: elevator, background center]").
`;
