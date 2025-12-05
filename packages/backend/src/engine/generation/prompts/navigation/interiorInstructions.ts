/**
 * Interior Space Instructions
 * Detailed instructions for generating interior niche spaces
 */

import { navigableElementsTemplate } from "./navigableElementsTemplate";

const interiorInstructionsTemplate1 = `

`;

const interiorInstructionsTemplate2 = `

Role
You are an expert interior-environment author for image generation prompts. 
Your single responsibility is to convert exterior “parent structure” data into a richly detailed, camera-ready **interior scene description** that is perfectly consistent with the parent’s form, orientation, materials, function, and scale.

Your text will be used directly as part of an image generation prompt, so every word must support a clear, physically coherent interior view.

PARENT STRUCTURE EXCLUSION (ABSOLUTE RULE):
NOT visible in background. NOT as backdrop. NOT in distance. NOT anywhere in the scene.
The camera has moved PAST/THROUGH it and focuses ONLY on what lies ahead.

Think: You walked through a doorway into a new room - you don't see the door anymore, you see the NEW ROOM.

{{CREATIVITY_INSTRUCTIONS}}

BEFORE creating the interior, READ THE PARENT'S STRUCTURE DATA:

1. FORM + ORIENTATION (MUST MATCH EXTERIOR - NO EXCEPTIONS)
**CRITICAL: Read BOTH structure.form AND structure.orientation from the parent. The interior MUST match both.**

FORM MATCHING RULES (MANDATORY):
- structure.form = "rectangular" → Interior MUST have STRAIGHT WALLS and CORNERS (NOT circular/round)
- structure.form = "round" → Interior can have circular plan
- structure.form = "cylindrical" → Interior has curved walls following cylinder axis
- structure.form = "faceted/geodesic" → Interior has geometric framework
- structure.form = "organic" → Interior has uneven/natural surfaces

**ORIENTATION MATCHING RULES (CRITICAL FOR CYLINDRICAL/ELONGATED SHAPES):**

CYLINDRICAL BUILDINGS - Orientation determines how the curve is experienced:
- orientation="horizontal" (laying cylinder, tunnel, barrel-vault, tank on its side):
  → Curved walls on LEFT and RIGHT sides of viewer
  → Flat or arched ends at FRONT (background) and BACK (behind camera)
  → Primary depth extends HORIZONTALLY (viewer looks down the tube/tunnel)
  → Floor is a curved surface at the bottom of the cylinder
  → Example: "A long tunnel-like corridor with curved metal walls arcing overhead on both sides, receding into the distance..."

- orientation="vertical" (standing cylinder, tower, silo, chimney):
  → Curved walls WRAP AROUND the viewer in a 360° arc
  → Circular floor plan, domed or flat ceiling above
  → Primary depth is VERTICAL (emphasis on height, looking up)
  → Example: "A circular chamber with smooth curved walls encircling the space, a domed ceiling high above..."

RECTANGULAR BUILDINGS - Orientation affects proportions:
- orientation="horizontal" (long hall, warehouse, corridor):
  → Long depth, moderate width, standard height
  → Emphasis on receding horizontal distance
  
- orientation="vertical" (tower, skyscraper, elevator shaft):
  → Emphasis on height and vertical space
  → May have stacked floors, vertical shafts, dramatic ceiling height

SPHERICAL/DOMED BUILDINGS:
- All orientations have curved surfaces in ALL directions
- Interior shows geodesic framework or smooth dome curving in every direction

**DO NOT CREATE A VERTICAL CYLINDER INTERIOR FOR A HORIZONTAL CYLINDER BUILDING.**
**DO NOT CREATE A CIRCULAR FLOOR PLAN FOR A HORIZONTAL CYLINDER - THE CURVE IS ON THE SIDES.**

Examples:
- Parent form="rectangular" → "A large rectangular hall with straight walls meeting at sharp corners..."
- Parent form="round" → "A circular chamber with curved walls..."
- Parent form="cylindrical", orientation="horizontal" → "A tunnel-like space with curved walls arching on left and right, extending into the distance..."
- Parent form="cylindrical", orientation="vertical" → "A tall cylindrical chamber with curved walls wrapping around, ceiling far above..."

2. CEILING (CRITICAL: SOLIDITY & OPACITY)
**ROOF INTEGRITY RULE: Construct a completely solid and continuous roof structure. Ensure fully enclosed opaque roofing with an unbroken roof surface.**
**NO SKYLIGHTS OR HOLES.** The ceiling must strictly block the sky unless the material type is explicitly glass.

- Match ceiling to roof type but seen from inside:
  domed → domed ceiling
  flat → flat ceiling
  vaulted → vaulted arches
  pitched/peaked → angled ceiling
  geodesic → faceted overhead structure

3. WINDOWS/OPENINGS
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

Examples by FUNCTIONAL TYPE:
RETAIL/COMMERCIAL SPACES (shops, boutiques, stores):
- Display racks with merchandise (5-10 throughout space)
- Sales counter or checkout area in midground
- Mannequins with clothing (2-4 positioned asymmetrically)
- Shelving units with products
- Add: Price tags, branded signage, fitting room entrances

RESIDENTIAL SPACES (homes, apartments):
- Seating (sofas, chairs, armchairs)
- Tables (coffee table, dining table, side tables)
- Storage furniture (cabinets, bookshelves)
- Add: Rugs, curtains, artwork, personal items

RELIGIOUS SPACES (temples, churches, shrines):
- Central altar or sacred focal point
- Seating or prayer areas (pews, cushions, mats)
- Religious symbols, statues, or iconography
- Add: Candles, incense, ceremonial objects

ENTERTAINMENT SPACES (clubs, bars, theaters, restaurants, lounges, cafes, pubs, dining areas, banquet halls, cafeterias, food courts etx):
- Seating areas (booths, lounge chairs, bar stools)
- Bar counter or service area
- Performance area (stage, dance floor, DJ booth)
- Add: Atmospheric lighting, sound equipment, drink displays

INDUSTRIAL SPACES (factories, warehouses, workshops):
- Machinery or workstations
- Storage systems (racks, pallets, shelving)
- Control panels or monitoring equipment
- Add: Safety signage, tool storage, transport equipment

CIVIC SPACES (offices, libraries, museums):
- Desks, workstations, or display cases
- Seating for visitors
- Information displays or exhibits
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
