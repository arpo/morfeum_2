/**
 * Interior Space Instructions
 * Detailed instructions for generating interior niche spaces
 */

export const interiorInstructionsTemplate = `
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
// export const interiorInstructionsTemplate = `
// PARENT STRUCTURE EXCLUSION (ABSOLUTE RULE):
// The parent structure (archway/portal/entrance/building) is COMPLETELY OUT OF FRAME.
// NOT visible in background. NOT as backdrop. NOT in distance. NOT anywhere in the scene.
// The camera has moved PAST/THROUGH it and focuses ONLY on what lies ahead.

// CRITICAL - DO NOT include, mention, or describe:
// - The parent archway/structure/building itself
// - "The parent structure behind you"
// - "The parent structure in the distance"  
// - "The parent structure as a backdrop"
// - "Looking back at the parent structure"
// - ANY visual reference to the parent structure whatsoever

// Think: You walked through a doorway into a new room - you don't see the door anymore, you see the NEW ROOM.

// {{CREATIVITY_INSTRUCTIONS}}

// BEFORE creating the interior, infer it from the parent structure:

// 1. FORM
// - Match interior shape to exterior geometry:
//   round → circular plan
//   rectangular → straight walls + corners
//   cylindrical/tubular → curved walls
//   faceted/geodesic → geometric framework
//   organic → uneven/natural surfaces
//   arched/gothic/roman → interior echoes arch style

// 2. CEILING
// - Match ceiling to roof type:
//   domed → domed ceiling
//   flat → flat ceiling
//   vaulted → vaulted arches
//   pitched/peaked → angled ceiling
//   geodesic → faceted overhead structure

// 3. SCALE
// - Use exterior size + Spatial Layout to set interior volume:
//   small (<15m): 3–5m ceilings
//   large (15–50m): 8–15m ceilings
//   colossal (>50m): 20m+ ceilings, huge spans, deep distance
// - Reflect dominant dimension (height/width/depth).
// - If exterior dimensions are known, interior height = 40–60% of total.
// - For houses: infer realistic interior style (flooring, wall materials, furniture) from exterior cues.

// 4. STRUCTURE TYPE (guides composition)
// - Vertical (towers/spires): emphasize height and upward depth.
// - Horizontal (halls/corridors): emphasize receding linear depth.
// - Wide (domes/arenas): emphasize circular expanse and roof curvature.

// 5. COMPOSITION (MUST include NAVIGABLE ELEMENTS *inside* these layers)
// [COMPOSITION:]
// - **Foreground:**  
//   Floor textures, entry-level details, and bases of structures shaped by FORM + SCALE.  
//   MUST include 1 navigable element with visual prominence  
//   (e.g., "illuminated stone steps rising left with soft glow [navigable: stairs, left]").

// - **Midground:**  
//   Core architectural structures influenced by FORM (columns, walls, curvature, arches).  
//   MUST include 1-2 navigable elements with clear visibility (THIS IS THE MOST VISIBLE LAYER)  
//   (e.g., "spotlit arched doorway on right, polished metal frame contrasting rough stone [navigable: door, right wall]").

// - **Background:**  
//   The dominant spatial cue based on STRUCTURE TYPE:  
//     • Vertical → soaring ceiling with stated height  
//     • Horizontal → long corridor or passage with stated depth  
//     • Wide → far curved walls or domed ceiling with stated diameter  
//   MAY include 1 navigable element if space allows  
//   (e.g., "distant glowing platform [navigable: platform, far center]").

// **NAVIGABLE ELEMENT REQUIREMENTS (CRITICAL):**  
// - MINIMUM: 2-3 navigable elements total across all layers
// - All navigable elements must be placed *inside Foreground, Midground, or Background*, never outside the COMPOSITION block
// - Allowed types: passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object

// **VISUAL PROMINENCE FOR NAVIGABLE ELEMENTS (CRITICAL):**
// Make navigable elements highly visible and distinct through:
// - **Lighting:** Illuminate with distinct light sources (glowing edges, spotlit, pools of light, bioluminescent markers, highlighted)
// - **Material Contrast:** Use contrasting materials (polished metal vs rough stone, smooth vs textured, different finishes)
// - **Color Differentiation:** Different color/tone from surrounding surfaces (warmer glow, cooler metal, brighter accents)
// - **Spatial Position:** Well-positioned, unobstructed, clearly framed, prominent placement
// - **Scale & Clarity:** Human-scale, adequately sized to be obvious, sharply defined edges
// - **Examples:** 
//   - "Corridor entrance bathed in warm orange glow, polished bronze frame" 
//   - "Spiral staircase illuminated by bioluminescent vines, contrasting dark metal against pale stone"
//   - "Archway with distinct blue-white light spilling through, ornate carved frame"

// **ASYMMETRIC COMPOSITION RULES (CRITICAL):**
// Create dynamic, interesting compositions by AVOIDING perfect symmetry:
// - **Rule of Thirds:** Position key navigable elements at 1/3 or 2/3 positions (left, right, upper, lower)
// - **Off-Center Framing:** Main focal points should NOT be dead center - shift left or right
// - **Diagonal Lines:** Use diagonal sight lines, angled walls, staircases, or passages to create depth
// - **Uneven Distribution:** Place more visual weight on one side (e.g., large door on left, smaller details on right)
// - **Varied Heights:** Mix low foreground elements with tall midground structures asymmetrically
// - **Avoid:** Perfect bilateral symmetry, centered archways, matching elements on both sides, mirror compositions
// - **Examples:**
//   - "Large illuminated doorway positioned in left third of frame, smaller passage visible far right"
//   - "Diagonal staircase ascending from lower right to upper left midground, lit by blue glow"
//   - "Massive column off-center right with glowing corridor entrance to its left"

// The interior architecture MUST reflect both FORM and SCALE from the analysis above.
// `;


