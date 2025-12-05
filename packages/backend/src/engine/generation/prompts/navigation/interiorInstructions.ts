/**
 * Interior Space Instructions
 * Detailed instructions for generating interior niche spaces
 */

import { navigableElementsTemplate } from "./navigableElementsTemplate";

const interiorInstructionsTemplate1 = `
IMMERSIVE INTERIOR PERSPECTIVE (ABSOLUTE RULE):

WALLS: The scene must be enclosed by walls/boundaries on all sides.
(Exception: If "Glass" structure, walls are transparent panels revealing sky/light, but MUST have visible structural framing).

PARENT EXCLUSION: The entrance/door you came through is OUT OF FRAME behind the camera. Focus forward.

{{CREATIVITY_INSTRUCTIONS}}

ICE PREVENTION PROTOCOL (CRITICAL FOR GLASS/CRYSTAL PARENTS):
If the structure is Glass/Crystal/Blue-toned:
1.  **ENFORCE STRUCTURAL GRID:** You MUST describe the **Metal/Steel/Composite framework** (mullions, struts, geodesic grid) holding the panels. Glass is NOT self-supporting.
2.  **FLOOR CONTRAST:** The floor MUST be a distinct, solid material (Polished Concrete, Dark Metal, Dark Stone). DO NOT match the floor color to the glass color (avoids "whiteout" effect).
3.  **BAN:** "Ice," "Frost," "Frozen," "Glacier," "Snow," "Cloudy Crystal."

BIOME & OVERGROWTH LOGIC (CONDITIONAL):
IF Clean/Inhabited: STRICT CONTAINMENT (No wild vines/grass). Built floors only.
IF Ruined/Abandoned: OVERGROWTH ALLOWED (Ivy, debris).
IF Nature-Themed: INTEGRATION (Living wood structures allowed).

ARCHITECTURAL LOGIC:

FORM: Match interior plan to exterior.
• Round → Circular plan.
• Globe/Sphere → **Geodesic/Ribbed Dome** (Show the grid).
• Rectangular → Straight walls.

CEILING: Match roof (domed→dome; flat→flat; vaulted→arches).

SCALE: Small (<15m)=3–5m ceilings; Large (>15m)=8–15m ceilings.

MATERIAL TRANSLATION LOGIC (CRITICAL):
Translate Exterior Materials into INTERIOR FINISHES.
• Ext. Glass/Crystal → **Int. ARCHITECTURAL GLAZING (High-Tech Atrium style)**.
  - *Texture:* Transparent, Reflective, Thin panels (NOT solid blocks).
  - *Detail:* Visible joining hardware, metal struts, ventilation ducts.
• Ext. Stone → Int. Polished Stone / Plaster / Masonry (Warm or Dark tones if room is blue).
• Ext. Wood → Int. Paneling / Beams.
• Ext. Metal → Int. Supports / Grating / Plating.
• Ext. Concrete → Int. Smooth Industrial.

COMPOSITION (CENTERED BUT ASYMMETRIC):
Asymmetric Content (CRITICAL): Content must NOT be mirrored.
AVOID: Bilateral symmetry.

NAVIGABLE ELEMENTS (MANDATORY):
MUST include 2-3 navigable elements inside the layers.
Types: Passage, corridor, stairs, ladder, ramp, platform, door, elevator, arch.
Visibility: Highlight via Lighting or Material Contrast.
POSITIONING: MUST state position: [navigable: item type, specific position].

[COMPOSITION LAYERS:]

Foreground: Floor textures/entry details. MUST include 1 navigable element.
(e.g., "dark polished stone platform with metal railing [navigable: platform, foreground center]").

Midground: Core structures (columns, walls). MUST include 1-2 visible navigable elements.
(e.g., "glass-paneled partition with steel frame on right [navigable: partition, midground right]").

Background: Dominant spatial cue. MAY include 1 element.
(e.g., "curved glass wall looking out to sky [navigable: window, background]").
`;



// Old longer prompt
const interiorInstructionsTemplate2 = `
PARENT STRUCTURE EXCLUSION (ABSOLUTE RULE):
NOT visible in background. NOT as backdrop. NOT in distance. NOT anywhere in the scene.
The camera has moved PAST/THROUGH it and focuses ONLY on what lies ahead.

Think: You walked through a doorway into a new room - you don't see the door anymore, you see the NEW ROOM.

{{CREATIVITY_INSTRUCTIONS}}

BEFORE creating the interior, READ THE PARENT'S STRUCTURE DATA:

1. FORM (MUST MATCH EXTERIOR - NO EXCEPTIONS)
**CRITICAL: The interior form MUST match the parent's structure.form field exactly.**

FORM MATCHING RULES (MANDATORY):
- structure.form = \"rectangular\" → Interior MUST have STRAIGHT WALLS and CORNERS (NOT circular/round)
- structure.form = \"round\" → Interior can have circular plan
- structure.form = \"cylindrical\" → Interior has curved walls
- structure.form = \"faceted/geodesic\" → Interior has geometric framework
- structure.form = \"organic\" → Interior has uneven/natural surfaces

**DO NOT CREATE A CIRCULAR/ROUND INTERIOR FOR A RECTANGULAR BUILDING.**
A rectangular exterior = rectangular interior with straight walls and 90-degree corners.

Examples:
- Parent form=\"rectangular\" → \"A large rectangular hall with straight walls meeting at sharp corners...\"
- Parent form=\"round\" → \"A circular chamber with curved walls...\"

2. CEILING (CRITICAL: SOLIDITY & OPACITY)
**ROOF INTEGRITY RULE: Construct a completely solid and continuous roof structure. Ensure fully enclosed opaque roofing with an unbroken roof surface.**
**NO SKYLIGHTS OR HOLES.** The ceiling must strictly block the sky unless the material type is explicitly glass.

- Match ceiling to roof type but seen from inside:
  domed → solid domed ceiling (opaque)
  flat → solid flat ceiling (opaque)
  vaulted → stone or wood vaulted arches (opaque)
  pitched/peaked → angled solid ceiling (opaque)
  geodesic → faceted overhead structure (solid panels)

3. WINDOWS/OPENINGS (WALLS ONLY)
- If exterior has windows/openings, interior MUST show them as well:
  large glass panels → interior glazing with framing
  arches/windows → interior arches/windows
  open spaces → interior openings/passages
  use arched/gothic/roman styles if exterior has them

4. SCALE
- Use exterior size + Spatial Layout to set interior volume:
  small (<15m): 3–5m ceilings
  large (15–50m): 8–15m ceilings
  colossal (>50m): 20m+ ceilings, huge spans, deep distance
- Reflect dominant dimension (height/width/depth).
- If exterior dimensions are known, interior height = 40–60% of total.
- For houses: infer realistic interior style (flooring, wall materials, furniture) from exterior cues.

5. STRUCTURE TYPE (guides composition)
- Vertical (towers/spires): emphasize height and upward depth.
- Horizontal (halls/corridors): emphasize receding linear depth.
- Wide (domes/arenas): emphasize circular expanse and roof curvature.

6. INTERIOR FURNISHING (MANDATORY - NOT OPTIONAL):
Based on the functionalType from the structure data, you MUST include appropriate fixtures.
The interior should NOT be empty - it must contain objects appropriate to its function.

RETAIL/COMMERCIAL SPACES (shops, boutiques, stores):
- MUST INCLUDE: Display racks with merchandise (5-10 throughout space)
- MUST INCLUDE: Sales counter or checkout area in midground
- MUST INCLUDE: Mannequins with clothing (2-4 positioned asymmetrically)
- MUST INCLUDE: Shelving units with products
- Add: Price tags, branded signage, fitting room entrances

RESIDENTIAL SPACES (homes, apartments):
- MUST INCLUDE: Seating (sofas, chairs, armchairs)
- MUST INCLUDE: Tables (coffee table, dining table, side tables)
- MUST INCLUDE: Storage furniture (cabinets, bookshelves)
- Add: Rugs, curtains, artwork, personal items

RELIGIOUS SPACES (temples, churches, shrines):
- MUST INCLUDE: Central altar or sacred focal point
- MUST INCLUDE: Seating or prayer areas (pews, cushions, mats)
- MUST INCLUDE: Religious symbols, statues, or iconography
- Add: Candles, incense, ceremonial objects

ENTERTAINMENT SPACES (clubs, bars, theaters):
- MUST INCLUDE: Seating areas (booths, lounge chairs, bar stools)
- MUST INCLUDE: Bar counter or service area
- MUST INCLUDE: Performance area (stage, dance floor, DJ booth)
- Add: Atmospheric lighting, sound equipment, drink displays

INDUSTRIAL SPACES (factories, warehouses, workshops):
- MUST INCLUDE: Machinery or workstations
- MUST INCLUDE: Storage systems (racks, pallets, shelving)
- MUST INCLUDE: Control panels or monitoring equipment
- Add: Safety signage, tool storage, transport equipment

CIVIC SPACES (offices, libraries, museums):
- MUST INCLUDE: Desks, workstations, or display cases
- MUST INCLUDE: Seating for visitors
- MUST INCLUDE: Information displays or exhibits
- Add: Reception areas, wayfinding signage

7. MATERIAL TRANSLATION LOGIC (CRITICAL):
Identify the PRIMARY EXTERIOR WALL MATERIAL and translate it to interior finishes.
IMPORTANT: Foundation material ≠ Wall material. A stone foundation does NOT mean stone interior walls.

MATERIAL PRIORITY (read the parent's materials description):
- If exterior walls are WOOD (clapboard, siding, timber, planks) → Interior MUST be wood paneling, wood plaster walls, or exposed timber
- If exterior walls are STONE (full stone walls, not just foundation) → Interior can be stone/plaster/masonry
- If exterior walls are BRICK → Interior can be exposed brick or plaster
- Foundation material (often stone) affects FLOOR only, not walls

TRANSLATION RULES:
• Ext. Wood Clapboard/Siding → **Int. Wood Paneling, Plaster over Wood Lath, or Exposed Beams**
  - NOT stone walls. A wooden house has wooden interior walls.
  - Typical: whitewashed wood panels, exposed timber frame, painted wood trim
• Ext. Timber Frame → Int. Exposed Beams + Plaster infill or Wood Paneling
• Ext. Stone (full walls) → Int. Polished Stone / Plaster / Masonry
• Ext. Brick → Int. Exposed Brick / Plaster / Painted Brick
• Ext. Glass/Crystal → **Int. ARCHITECTURAL GLAZING (High-Tech Atrium style)**
• Ext. Metal → Int. Supports / Grating / Plating
• Ext. Concrete → Int. Smooth Industrial

**SOLID CEILING ENFORCEMENT:** Unless the material is explicitly Glass/Crystal, the ceiling material must be **100% OPAQUE and SOLID**. Do not render transparency in wood, stone, brick, or concrete roofs.

FOUNDATION vs WALLS (CRITICAL):
- Stone foundation + Wood walls = Wood paneled interior, stone may appear on FLOOR only
- Stone foundation does NOT mean stone interior walls
- Read the \"materials\" field carefully - what is the PRIMARY WALL material?

${navigableElementsTemplate}

**ASYMMETRIC COMPOSITION RULES (CRITICAL):**
Create dynamic, interesting compositions by AVOIDING perfect symmetry:
- **Rule of Thirds:** Position key navigable elements at 1/3 or 2/3 positions (left, right, upper, lower)
- **Off-Center Framing:** Main focal points should NOT be dead center - shift left or right
- **Diagonal Lines:** Use diagonal sight lines, angled walls, staircases, or passages to create depth
- **Uneven Distribution:** Place more visual weight on one side (e.g., large door on left, smaller details on right)
- **Varied Heights:** Mix low foreground elements with tall midground structures asymmetrically
- **Avoid:** Perfect bilateral symmetry, centered archways, matching elements on both sides, mirror compositions
- **Examples:**
  - "Large illuminated doorway positioned in left third of frame, smaller passage visible far right"
  - "Diagonal staircase ascending from lower right to upper left midground, lit by blue glow"
  - "Massive column off-center right with glowing corridor entrance to its left"

The interior architecture MUST reflect both FORM and SCALE from the analysis above.
`;


export const interiorInstructionsTemplate = interiorInstructionsTemplate2;
