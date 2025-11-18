/**
 * Exterior Space Instructions
 * Detailed instructions for generating exterior niche spaces
 */

/**
 * Template for exterior space instructions
 * Contains a placeholder {{CREATIVITY_INSTRUCTIONS}} that will be replaced
 * with the appropriate creativity level instructions
 */
export const exteriorInstructionsTemplate = `
PARENT STRUCTURE EXCLUSION (ABSOLUTE RULE):
The parent structure (archway/portal/entrance/building) is COMPLETELY OUT OF FRAME.
NOT visible in background. NOT as backdrop. NOT in distance. NOT anywhere in the scene.
The camera has moved PAST/THROUGH it and focuses ONLY on what lies ahead.

CRITICAL - DO NOT include, mention, or describe:
- The parent archway/structure/building itself
- "The parent structure behind you"
- "The parent structure in the distance"  
- "The parent structure as a backdrop"
- "Looking back at the parent structure"
- ANY visual reference to the parent structure whatsoever

Think: You walked through a doorway into a new room - you don't see the door anymore, you see the NEW ROOM.

{{CREATIVITY_INSTRUCTIONS}}

BEFORE creating the exterior niche, infer it from the parent location:

1. TERRAIN & GROUND
- Match ground surface to parent location context:
  flat terrain → even ground plane, clear pathways
  rolling/hilly → undulating surfaces, elevation changes
  terraced → stepped levels, platforms at different heights
  rocky/rough → irregular surfaces, natural stone formations
  sandy/desert → soft surfaces, shifting textures
  cultivated → manicured grass, gardens, paved areas

2. MATERIALS & SURFACES
- Materials manifest in outdoor context with natural weathering:
  metal → oxidation, rust patina, reflective sun glints, aged bronze/copper
  stone → weathering, erosion patterns, lichen, moss growth
  wood → sun-bleached, cracked grain, weathered gray tones
  glass → reflective qualities, dust accumulation, transparency effects
  natural elements → vegetation, water features, raw earth
- Ground surface materials:
  grass, stone pavement, gravel, sand, wooden decking, earth paths, crushed shells, brick, tile
- Texture interaction with sunlight:
  rough surfaces → deep shadows, texture highlights
  polished surfaces → sharp reflections, glare
  translucent materials → light transmission, glow effects

3. SKY & ATMOSPHERE
- Sky visibility and coverage:
  open sky → full atmospheric exposure, direct sunlight/moonlight
  partial cover → trees, fabric canopies, pergolas, scattered shade
  structural shade → architectural elements creating shadow patterns
- Atmospheric conditions affect visibility and mood:
  clear → crisp visibility, sharp shadows, vibrant colors
  hazy → diffused light, softened edges, atmospheric perspective
  misty → reduced visibility, ethereal quality, light scatter
  dusty → particulate glow, dramatic light shafts

4. SCALE & AREA
- Use Spatial Layout to set outdoor footprint:
  intimate (<50m²): 5–15m sight lines, enclosed feeling despite being outdoors
  medium (50–500m²): 20–50m sight lines, comfortable scale
  expansive (>500m²): 50m+ sight lines, vast open feeling
- Reflect dominant dimension (length/width/depth)
- For installations: match scale to human interaction (reachable, walkable, monumental)

5. ENVIRONMENTAL TYPE (guides composition)
- Plaza/clearing: emphasize open central space, radial organization
- Path/trail: emphasize linear progression, journey feeling
- Installation cluster: emphasize scattered points of interest, exploration
- Garden/grove: emphasize natural integration, organic flow

6. COMPOSITION (MUST include NAVIGABLE ELEMENTS *inside* these layers)
[COMPOSITION:]
- **Foreground:**  
  Ground textures, immediate surface details, entry-level elements shaped by TERRAIN + MATERIALS.  
  MUST include 1 navigable element with visual prominence  
  (e.g., "weathered stone path curving left, moss-filled cracks catching sunlight [navigable: path, left]").

- **Midground:**  
  Primary installations, structures, or landscape features influenced by ENVIRONMENTAL TYPE.  
  MUST include 1-2 navigable elements with clear visibility (THIS IS THE MOST VISIBLE LAYER)  
  (e.g., "illuminated metallic sculpture right of center, rusted surface glowing in late sun, wooden platform at its base [navigable: platform, right center]").

- **Background:**  
  The dominant spatial cue based on ENVIRONMENTAL TYPE:  
    • Plaza/clearing → far edge with stated distance, horizon line
    • Path/trail → extending pathway with stated depth, vanishing into distance  
    • Installation cluster → distant installations with stated separation
  MAY include 1 navigable element if space allows  
  (e.g., "distant raised viewing platform, silhouetted against sky [navigable: platform, far background]").

**NAVIGABLE ELEMENT REQUIREMENTS (CRITICAL):**  
- MINIMUM: 2-3 navigable elements total across all layers
- All navigable elements must be placed *inside Foreground, Midground, or Background*, never outside the COMPOSITION block
- Allowed types: path, trail, platform, bridge, installation, clearing, steps, ramp, walkway, structure, sculpture (if interactable)

**VISUAL PROMINENCE FOR NAVIGABLE ELEMENTS (CRITICAL):**
Make navigable elements highly visible and distinct through:
- **Lighting:** Natural sun/moon light interaction (sunlit paths, shadow-cast steps, backlit structures, golden hour glow)
- **Material Contrast:** Contrasting materials (polished metal vs rough earth, smooth stone vs wild grass, weathered wood vs fresh vegetation)
- **Color Differentiation:** Different color/tone from surroundings (warm paths vs cool grass, bright installations vs muted landscape)
- **Spatial Position:** Well-positioned, unobstructed, clearly defined against sky or landscape
- **Scale & Clarity:** Human-scale, adequately sized to be obvious, clear edges/boundaries
- **Examples:**
  - "Sunlit gravel path winding through left third, warm ochre contrasting deep green grass"
  - "Oxidized copper platform catching late afternoon light, elevated 1m above ground on right"
  - "Weathered wooden bridge spanning diagonal from lower left to upper right, sun-bleached planks"

**ASYMMETRIC COMPOSITION RULES (CRITICAL):**
Create dynamic, interesting compositions by AVOIDING perfect symmetry:
- **Rule of Thirds:** Position key navigable elements at 1/3 or 2/3 positions (left, right, upper, lower)
- **Off-Center Framing:** Main focal points should NOT be dead center - shift left or right
- **Diagonal Lines:** Use diagonal sight lines, angled paths, scattered installations to create depth
- **Uneven Distribution:** Place more visual weight on one side (e.g., large installation on left, smaller elements on right)
- **Varied Heights:** Mix ground-level foreground with elevated midground structures asymmetrically
- **Avoid:** Perfect bilateral symmetry, centered pathways, matching elements on both sides, mirror compositions
- **Examples:**
  - "Large glowing installation positioned in left third of frame, smaller sculptures scattered far right"
  - "Diagonal pathway ascending from lower right to upper left, lit by setting sun"
  - "Massive stone monolith off-center right with wooden platform to its left"

7. LIGHTING & ATMOSPHERE
- Natural light quality and direction:
  morning → soft, cool, long shadows from low angle (east)
  midday → harsh, short shadows, high contrast
  afternoon → warm, golden, medium shadows from angle (west)
  dusk/dawn → dramatic, colored (orange/pink/purple), very long shadows
  night → moonlight, installed lighting, bioluminescence
- Weather effects enhance atmosphere:
  wind → moving grass, swaying trees, dust particles
  mist → softened visibility, mysterious depth, light scatter
  rain aftermath → wet reflections, puddles, glistening surfaces

The outdoor niche MUST reflect TERRAIN, MATERIALS, SCALE, and ENVIRONMENTAL TYPE from the analysis above.
`;
