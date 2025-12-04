/**
 * Interior Space Instructions
 * Detailed instructions for generating interior niche spaces
 */

import { navigableElementsTemplate } from "./navigableElementsTemplate";

const interiorInstructionsTemplate1 = `
[CAMERA CONTEXT]
INTERNAL VIEW ONLY. Camera is INSIDE. Parent exterior structure is INVISIBLE/BEHIND camera. Focus on new room ahead.

{{CREATIVITY_INSTRUCTIONS}}

[STRICT ARCHITECTURAL RULES]

1. FORM MATCHING (structure.form → interior geometry)
- rectangular → STRAIGHT walls, 90° sharp corners (NO curves).
- round/cylindrical → CURVED walls, circular plan.
- faceted → GEOMETRIC framework.
- organic → UNEVEN/natural surfaces.
*CRITICAL: Rectangular exterior = Rectangular interior.*

2. CEILING & ROOF (SOLIDITY ENFORCEMENT)
**RULE: CEILING MUST BE A CONTINUOUS, SOLID, OPAQUE SURFACE.**
**NO SKYLIGHTS, NO HOLES, NO OPEN LATTICE.**
- Shape: Match roof (domed→domed, flat→flat, pitched→angled).
- Material: Must be opaque (unless strictly Glass/Crystal).

3. WINDOWS
- Mirror exterior openings: Large glass→glazing; Arches→arched windows; Solid walls→Solid walls.

4. SCALE & VOLUME
- Small (<15m): 3-5m ceiling. Large (>15m): 8-15m ceiling. Colossal (>50m): 20m+ ceiling.
- Interior height ≈ 40-60% of total structure height.

5. FURNISHING (By functionalType - SPACE CANNOT BE EMPTY)
- Retail: Display racks, merchandise, sales counter, mannequins, shelving.
- Residential: Sofas, dining tables, storage, rugs, personal items.
- Religious: Altar, pews/mats, iconography, candles, ceremonial objects.
- Entertainment: Booths/bar stools, bar counter, stage/dance floor, lighting.
- Industrial: Machinery, storage racks, control panels, safety signs.
- Civic: Desks, seating, info displays, reception.

6. MATERIAL TRANSLATION (Ext. Wall → Int. Finish)
*Priority: Wall Material dictates interior (Ignore Foundation material).*
- Ext. Wood/Siding → Int. Wood paneling, plaster over lath, exposed beams.
- Ext. Stone (Walls) → Int. Polished stone, plaster, masonry.
- Ext. Brick → Int. Exposed brick, painted brick.
- Ext. Glass → Int. Architectural glazing (High-tech).
- Ext. Concrete → Int. Smooth industrial.

${navigableElementsTemplate}

[COMPOSITION: ASYMMETRY REQUIRED]
- Rule of Thirds: Place key elements at 1/3 or 2/3 marks.
- Off-Center: Main focal point shifted left/right (NEVER dead center).
- Depth: Use diagonal sight lines and varied heights.
- AVOID: Bilateral symmetry, mirror images.
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
- structure.form = "rectangular" → Interior MUST have STRAIGHT WALLS and CORNERS (NOT circular/round)
- structure.form = "round" → Interior can have circular plan
- structure.form = "cylindrical" → Interior has curved walls
- structure.form = "faceted/geodesic" → Interior has geometric framework
- structure.form = "organic" → Interior has uneven/natural surfaces

**DO NOT CREATE A CIRCULAR/ROUND INTERIOR FOR A RECTANGULAR BUILDING.**
A rectangular exterior = rectangular interior with straight walls and 90-degree corners.

Examples:
- Parent form="rectangular" → "A large rectangular hall with straight walls meeting at sharp corners..."
- Parent form="round" → "A circular chamber with curved walls..."

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
- Read the "materials" field carefully - what is the PRIMARY WALL material?

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
