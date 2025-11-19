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
PARENT STRUCTURE EXCLUSION (ABSOLUTE RULE):
The parent structure (entry/doorway/portal) is COMPLETELY OUT OF FRAME behind the camera.
Camera focuses ONLY on the new room ahead.
DO NOT render the door you just entered.

{{CREATIVITY_INSTRUCTIONS}}

FUNCTIONAL IDENTITY & ANTI-DRIFT (STRICT PRIORITY):
1. Detect Parent Function: Manor, Factory, Temple, Bunker, etc.
2. Interior MUST behave like that function regardless of style.
   - House/Manor → DOMESTIC (Foyers, halls, parlors). NEVER cavernous voids/cathedral-like.
     (NO: Naves, Pews, Altars. YES: Staircase Hall, Reception Room).
   - Factory/Bunker → UTILITARIAN/INDUSTRIAL. NEVER dungeon-like.
     (NO: Medieval stonework/torches. YES: Machinery, catwalks, assembly floor).
   - Castle/Palace → MONUMENTAL (Throne rooms, galleries).
   - Cave → NATURAL (Uneven floors, organic rock).

ARCHITECTURAL CONSISTENCY (STYLE MIRRORING):
match architectural_complexity: (Basic→Minimal | Ornate→Detailed | Rustic→Weathered | Modern→Sleek).
* ELEMENTS MUST MATCH EXTERIOR STYLE:
  - Windows: Echo exterior curvature (arched/square/slit).
  - Doorways: Match arch style of parent (rounded/pointed/flat).
  - Columns/Pillars: Interior columns must match exterior style, proportion, and material.
  - Trim/Molding: Match exterior complexity level.
  - Ceiling Details: Reflect exterior roof complexity (flat vs vaulted vs coffered).
* FLORA EXCLUSION: NO outdoor vegetation (grass/trees/vines) on floors/walls. Potted plants ONLY.

GEOMETRY & SCALE:
1. FORM: Match interior shape to exterior geometry (Round→Circular plan | Rectangular→Corners | Gothic→Arched).
2. CEILING: Match roof type (Domed→Dome | Flat→Flat | Pitched→Angled).
3. SCALE:
   - Small (<15m): 3–5m ceilings.
   - Large/Colossal: 8–20m+ ceilings.
   - Structure Type: Vertical (Towers) → Upward depth. Horizontal (Halls) → Linear depth. Wide (Arenas) → Radial.

MATERIALS & LIGHTING (ADAPTATION RULE):
PRESERVE material family. ADAPT finish for interior.
- Stone Ext. → Interior: Polished stone floors, plastered/exposed stone walls.
- Wood Ext. → Interior: Paneling, beams, wood flooring.
- Metal Ext. → Interior: Metal fixtures, grates, structural supports.
- Sci-Fi/Synths → Keep synthetic. DO NOT replace with natural materials.
- GROUND RULE: NO outdoor ground (dirt/sand/grass) inside. Use built flooring (tile/wood/concrete).

COMPOSITION (ASYMMETRIC & NAVIGABLE):
RULES:
- NO perfect symmetry. Use Rule of Thirds. Offset focal points.
- MUST include 2-3 "Navigable Elements" total (passages, stairs, ramps, doors).
- VISUAL PROMINENCE: Navigable elements must be highlighted via Light (glow/spots), Contrast (material), or Color.

[COMPOSITION LAYERS]
- **Foreground:**
  Floor textures + 1 Navigable Element with visual prominence.
  (e.g., "illuminated stone steps rising left [navigable: stairs, left]").

- **Midground:**
  Core architectural structures (columns, walls, arches) echoing FORM.
  MUST include 1-2 Navigable Elements (HIGH VISIBILITY).
  (e.g., "spotlit arched doorway on right, metal frame [navigable: door, right]").

- **Background:**
  Dominant spatial cue (Depth/Height).
  MAY include 1 distant navigable element.
`;
