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
The parent structure (archway/portal/entrance/building) is COMPLETELY OUT OF FRAME.
NOT visible in background. NOT as backdrop. NOT in distance. NOT anywhere in the scene.
The camera has moved PAST/THROUGH it and focuses ONLY on what lies ahead.

Think: You walked through a doorway into a new room - you don't see the door anymore, you see the NEW ROOM.

{{CREATIVITY_INSTRUCTIONS}}

BEFORE creating the interior, infer it from the parent structure:

FUNCTIONAL IDENTITY (CRITICAL - THE ABSOLUTE PRIORITY):
- Determine the PARENT STRUCTURE'S FUNCTIONAL IDENTITY (Manor, Factory, Temple, Bunker, Shop, etc.)
- The interior MUST behave and look like that functional space first, regardless of style.
- House/Manor/Cottage → RESIDENTIAL/DOMESTIC (foyers, halls, parlors, living spaces, not cavernous voids)
- Castle/Palace → MONUMENTAL/GRAND (throne rooms, great halls, vast galleries)
- Temple/Cathedral → RELIGIOUS/CEREMONIAL (naves, altars, soaring vaults, rows of pillars)
- Bunker/Prison → UTILITARIAN/CONFINED (corridors, cells, control rooms, low ceilings)
- Cave/Grotto → NATURAL/ORGANIC (rock formations, uneven floors, pools)

ANTI-DRIFT RULES (PREVENT STYLE FROM OVERRIDING FUNCTION):
- If it's a HOUSE (even a Gothic one), it should NOT look like a Church or Cathedral.
  - AVOID: "Nave-like", "Cathedral ceiling", "Temple scale", "Altars", "Pews"
  - USE: "Grand Foyer", "Staircase Hall", "Entryway", "Parlor", "Reception Room"
- If it's a FACTORY, it should NOT look like a Dungeon.
  - AVOID: "Medieval stonework", "Torches", "Cell blocks"
  - USE: "Machinery", "Assembly floor", "Catwalks", "Industrial lighting"

ARCHITECTURAL CONSISTENCY (CRITICAL - MUST FOLLOW):
- Match architectural complexity to parent's architectural_tone:
  • basic/simple/utilitarian → minimal ornamentation, functional design, simple fixtures
  • ornate/decorative/elaborate → rich details, decorative elements, sophisticated craftsmanship
  • rustic/traditional → handcrafted feel, traditional craftsmanship, weathered character
  • modern/contemporary → clean lines, minimal decoration, sleek finishes
  • industrial → exposed structure, raw finishes, functional aesthetic
  
- ARCHITECTURAL ELEMENTS MUST MATCH EXTERIOR STYLE (CRITICAL):
  • Windows: If exterior has arched windows → interior arches/doorways echo this curve style
  • Doorways: Match arch style (rounded/pointed/flat/squared) from exterior architecture
  • Columns/Pillars: Interior columns must match exterior column style, proportion, and material
  • Trim/Molding: Match complexity level from exterior (simple vs ornate)
  • Ceiling Details: Reflect exterior roof complexity (simple flat vs elaborate coffers/vaults)
  
- FLORA/FAUNA EXCLUSION FOR ENCLOSED INTERIORS (CRITICAL):
  • NO outdoor vegetation (trees, bushes, grass, wildflowers, vines growing freely) in enclosed spaces
  • NO fauna_base elements inside enclosed buildings
  • Acceptable indoor greenery ONLY: potted plants, cultivated indoor species, deliberate indoor gardens/atriums
  • If flora_base exists in DNA: interpret as color palette inspiration or decorative motifs (carved patterns, painted themes), NOT literal living plants
  • Exception: Open-air structures (courtyards, pavilions with no walls) may have controlled landscaping

1. FORM
- Match interior shape to exterior geometry:
  round → circular plan
  rectangular → straight walls + corners
  cylindrical/tubular → curved walls
  faceted/geodesic → geometric framework
  organic → uneven/natural surfaces
  arched/gothic/roman → interior echoes arch style

2. CEILING
- Match ceiling to roof type:
  domed → domed ceiling
  flat → flat ceiling
  vaulted → vaulted arches
  pitched/peaked → angled ceiling
  geodesic → faceted overhead structure

3. SCALE
- Use exterior size + Spatial Layout to set interior volume:
  small (<15m): 3–5m ceilings
  large (15–50m): 8–15m ceilings
  colossal (>50m): 20m+ ceilings, huge spans, deep distance
- Reflect dominant dimension (height/width/depth).
- If exterior dimensions are known, interior height = 40–60% of total.
- For houses: infer realistic interior style (flooring, wall materials, furniture) from exterior cues.

4. STRUCTURE TYPE (guides composition)
- Vertical (towers/spires): emphasize height and upward depth.
- Horizontal (halls/corridors): emphasize receding linear depth.
- Wide (domes/arenas): emphasize circular expanse and roof curvature.

5. MATERIALS & LIGHTING
- PRESERVE exact material types from parent - DO NOT substitute with different material categories
- Adaptation means CONFIGURATION/FINISH, not material replacement:
  - Oxidized metal → interior panels/walls/floors of oxidized metal (NOT wood/stone/plaster)
  - Ice → interior ice formations/structures (NOT converted to glass/crystal unless parent specifies)
  - Synthetic materials → keep synthetic (NOT replaced with natural materials)
  - Stone → interior stone surfaces (polished/rough variations acceptable, same material)
- Genre determines material vocabulary:
  - Sci-fi/alien → metallic alloys, synthetics, technological materials stay dominant
  - Fantasy → magical materials stay magical
  - Natural → organic materials stay organic
- Interior finish variations (acceptable within same material):
  - Polished vs rough (same base material)
  - Paneled vs exposed (same base material)
  - Integrated fixtures in same material family

- INTERIOR MATERIAL TRANSFORMATIONS (how exterior materials appear inside):
  • Exterior stone → interior: polished stone floors, plastered/exposed stone walls, stone accents
  • Exterior wood → interior: wood paneling, flooring, ceiling beams, trim details
  • Exterior metal → interior: metal fixtures, railings, decorative elements, structural supports
  • Exterior glass → interior: windows, partitions, skylights, decorative panels
  • Exterior brick → interior: exposed brick walls, brick flooring, painted brick
  • Exterior concrete → interior: polished concrete floors, concrete walls (smooth or textured)

- QUALITY LEVEL must match architectural_tone:
  • Basic/utilitarian exterior → simple finishes, practical materials, minimal decoration
  • High-quality/ornate exterior → refined finishes, premium materials, decorative details
  • Rustic exterior → weathered finishes, handcrafted elements, natural imperfections
  • Modern exterior → clean finishes, precise details, contemporary materials

- NO OUTDOOR GROUND MATERIALS in enclosed interiors:
  • NO grass, soil, dirt, sand (unless deliberately an indoor garden feature)
  • NO outdoor vegetation spreading across floors/walls
  • Use proper flooring: wood, stone, tile, carpet, metal, concrete, etc.

- Match lighting fixtures to material context (technological fixtures for tech materials, organic sources for natural materials)

6. COMPOSITION (MUST include NAVIGABLE ELEMENTS *inside* these layers)
[COMPOSITION:]
- **Foreground:**  
  Floor textures, entry-level details, and bases of structures shaped by FORM + SCALE.  
  MUST include 1 navigable element with visual prominence  
  (e.g., "illuminated stone steps rising left with soft glow [navigable: stairs, left]").

- **Midground:**  
  Core architectural structures influenced by FORM (columns, walls, curvature, arches).  
  MUST include 1-2 navigable elements with clear visibility (THIS IS THE MOST VISIBLE LAYER)  
  (e.g., "spotlit arched doorway on right, polished metal frame contrasting rough stone [navigable: door, right wall]").

- **Background:**  
  The dominant spatial cue based on STRUCTURE TYPE:  
    • Vertical → soaring ceiling with stated height  
    • Horizontal → long corridor or passage with stated depth  
    • Wide → far curved walls or domed ceiling with stated diameter  
  MAY include 1 navigable element if space allows  
  (e.g., "distant glowing platform [navigable: platform, far center]").

**NAVIGABLE ELEMENT REQUIREMENTS (CRITICAL):**  
- MINIMUM: 2-3 navigable elements total across all layers
- All navigable elements must be placed *inside Foreground, Midground, or Background*, never outside the COMPOSITION block
- Allowed types: passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object

**VISUAL PROMINENCE FOR NAVIGABLE ELEMENTS (CRITICAL):**
Make navigable elements highly visible and distinct through:
- **Lighting:** Illuminate with distinct light sources (glowing edges, spotlit, pools of light, bioluminescent markers, highlighted)
- **Material Contrast:** Use contrasting materials (polished metal vs rough stone, smooth vs textured, different finishes)
- **Color Differentiation:** Different color/tone from surrounding surfaces (warmer glow, cooler metal, brighter accents)
- **Spatial Position:** Well-positioned, unobstructed, clearly framed, prominent placement
- **Scale & Clarity:** Human-scale, adequately sized to be obvious, sharply defined edges
- **Examples:** 
  - "Corridor entrance bathed in warm orange glow, polished bronze frame" 
  - "Spiral staircase illuminated by bioluminescent vines, contrasting dark metal against pale stone"
  - "Archway with distinct blue-white light spilling through, ornate carved frame"

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
