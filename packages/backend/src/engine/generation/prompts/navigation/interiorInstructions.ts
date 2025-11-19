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

CAMERA POSITION: The camera is DEEP INSIDE the room.

ABSOLUTELY NO: "Dollhouse" views, Cross-sections, "Cutaway" views, or "Half-Indoor/Half-Outdoor" compositions.

WALLS: The scene must be enclosed by walls/boundaries on all sides (unless specifically an open-air courtyard).

SKY: No open sky visible except through defined architectural openings (windows, skylights, cracks in ruins).

PARENT EXCLUSION: The entrance/door you came through is OUT OF FRAME behind the camera. Focus forward.

{{CREATIVITY_INSTRUCTIONS}}

FUNCTIONAL IDENTITY (THE PRIORITY):

Determine PARENT FUNCTION (Manor, Factory, Temple, Bunker, etc.) -> Interior MUST behave like that space.

House/Cottage → RESIDENTIAL (foyers, halls, parlors; not cavernous voids).

Castle/Palace → MONUMENTAL (throne rooms, great halls, galleries).

Temple/Cathedral → RELIGIOUS (naves, altars, soaring vaults).

Bunker/Prison → UTILITARIAN (corridors, cells, low ceilings).

Cave/Grotto → NATURAL (rock formations, uneven floors).

BIOME & OVERGROWTH LOGIC (CONDITIONAL): Analyze the implied CONDITION to determine nature level:

IF Clean/Inhabited (e.g., Modern Lab, Occupied Manor):

STRICT CONTAINMENT: NO wild vines, ivy, or grass indoors. Floors must be built materials.

ALLOWED: Potted plants, vases, deliberate indoor gardens only.

IF Ruined/Abandoned (e.g., Ancient Ruins, Dungeon):

OVERGROWTH ALLOWED: Ivy on walls, roots breaking floors, debris are acceptable.

IF Nature-Themed (e.g., Elven Hall, Druid Hut):

INTEGRATION: Living wood, flowered vines, and woven branches are acceptable structural elements.

ARCHITECTURAL LOGIC:

FORM: Match interior plan to exterior (round→circular; rectangular→corners).

CEILING: Match roof (domed→dome; flat→flat; vaulted→arches).

SCALE: Small (<15m)=3–5m ceilings; Large (>15m)=8–15m ceilings.

MATERIALS: PRESERVE EXTERIOR MATERIALS.

Stone→Stone; Wood→Wood; Metal→Metal; Concrete→Concrete.

Flooring: MUST be built material (Wood, Tile, Stone) UNLESS structure is Cave/Ruined.

COMPOSITION (CENTERED BUT ASYMMETRIC):

Camera: Central perspective (1-point) looking into depth allowed.

Asymmetric Content (CRITICAL): Content must NOT be mirrored.

If a heavy element (staircase) is on LEFT, the RIGHT must be open or different.

AVOID: Bilateral symmetry, matching columns on both sides.

NAVIGABLE ELEMENTS (MANDATORY):

MUST include 2-3 navigable elements inside the layers.

Types: Passage, corridor, stairs, ladder, ramp, platform, door.

Visibility: Highlight via Lighting (glow/spots) or Material Contrast.

POSITIONING: You MUST explicitly state the position of every navigable element in the output prompt using format: [navigable: item type, specific position].

[COMPOSITION LAYERS:]

Foreground: Floor textures/entry details. MUST include 1 navigable element. (e.g., "polished tile steps rising on the left [navigable: steps, foreground left]").

Midground: Core structures (columns, walls). MUST include 1-2 visible navigable elements. (e.g., "open archway on right wall leading to dark room [navigable: archway, midground right]").

Background: Dominant spatial cue (height/depth). MAY include 1 element. (e.g., "distant elevator door at end of hall [navigable: elevator, background center]").
`;
