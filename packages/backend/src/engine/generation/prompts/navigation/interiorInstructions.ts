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

BEFORE creating the interior, infer it from the parent structure:

1. FORM
- Match interior shape to exterior geometry:
  round → circular plan
  rectangular → straight walls + corners
  cylindrical/tubular → curved walls
  faceted/geodesic → geometric framework
  organic → uneven/natural surfaces, curved walls
  arched/gothic/roman → interior echoes arch style
  If exterior is vast open space (e.g., dome, arena), interior should have high ceiling and wide open volume

2. CEILING
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

6 INTERIOR PROPERTIES:
- Match the locations characteristics to fot the interior style:
- If its a shop add shop shelves and counters, mannequins etc
- If its a temple add altars, statues, candles
- If its a residential structure add furniture like tables, chairs, beds
- If its a castle add medieval elements like torches and banners
- if its a futuristic structure add sci-fi elements like holograms and control panels

7. MATERIAL TRANSLATION LOGIC (CRITICAL):
Translate Exterior Materials into INTERIOR FINISHES. But use interior-appropriate materials.
• Ext. Glass/Crystal → **Int. ARCHITECTURAL GLAZING (High-Tech Atrium style)**.
  - *Texture:* Transparent, Reflective, Thin panels (NOT solid blocks).
  - *Detail:* Visible joining hardware, metal struts, ventilation ducts.
• Ext. Stone → Int. Polished Stone / Plaster / Masonry (Warm or Dark tones if room is blue).
• Ext. Wood → Int. Paneling / Beams.
• Ext. Metal → Int. Supports / Grating / Plating.
• Ext. Concrete → Int. Smooth Industrial.



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