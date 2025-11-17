/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

import type { NavigationContext, IntentResult, NavigationDecision } from '../../../navigation/types';
import { fluxInstructionsShort } from '../shared/constants';

/**
 * Generate dynamic creativity instructions based on creativity level
 * @param level 0.0 (conservative) to 1.0 (bold)
 */
function getCreativityInstructions(level: number): string {
  if (level < 0.3) {
    // Conservative: Stay very close to parent
    return `CREATIVE NICHE GENERATION (CONSERVATIVE - Level ${level.toFixed(1)}):
- The parent sets the THEME (materials, mood, style, colors, DNA)
- The niche should use the SAME materials as the parent in slightly different forms
- Think: minor scale variations, repositioning - NOT new material types
- Add subtle details using the existing material palette only
- The space should feel like a natural extension of the parent

Material adherence:
- Use SAME primary materials in different scales or configurations
- Variations are subtle: smaller pieces, grouped differently, different heights
- NO new material types introduced
- Lighting style remains identical
- Form variations are minimal

Pattern: If parent has [X material], niche uses [X material] in varied arrangements only`;
  } else if (level < 0.7) {
    // Moderate: Allow complementary materials
    return `CREATIVE NICHE GENERATION (MODERATE - Level ${level.toFixed(1)}):
- The parent sets the THEME (materials, mood, style, colors, DNA)
- The niche should contain NEW elements that fit this theme but are DISTINCT
- Think: variations, extensions, related features - NOT copies of the parent
- Add creative details that weren't mentioned in the parent description
- The space should feel like a DISCOVERY, not just another view of the same thing

Principles of creative variation (learn the concept, don't copy examples):
- Parent provides MATERIALS → Niche adds new structures/features using those same materials in different forms
- Parent establishes SCALE → Niche includes varied-scale elements (smaller, larger, grouped, scattered)
- Parent sets LIGHTING STYLE → Niche extends that lighting in new creative ways
- Parent defines TERRAIN/FORM → Niche adds new ground/surface features fitting that context
- Parent shows PRIMARY FEATURE → Niche introduces complementary secondary features, interaction points, exploration elements

General pattern to follow:
If parent has [X primary element with Y materials], the niche should add related but NEW elements using Y materials in different configurations, scales, or functions that invite further exploration`;
  } else {
    // Bold: Encourage contrasting elements
    return `CREATIVE NICHE GENERATION (BOLD - Level ${level.toFixed(1)}):
- The parent sets the THEME (mood, DNA, environment) - these are LOCKED
- The niche introduces CONTRASTING materials and UNEXPECTED elements
- Think: Burning Man principle - walking through different art installations on the same playa at the same time
- Add 2-3 unexpected elements that fit the mood/DNA but contrast with parent materials
- The space should feel like a SURPRISING DISCOVERY

LOCKED (cannot change at any creativity level):
- ENVIRONMENT: Desert stays desert, cave stays cave, plaza stays plaza, forest stays forest
- TIME OF DAY: Twilight stays twilight, dawn stays dawn, night stays night
- ATMOSPHERE: Misty stays misty, dusty stays dusty, clear stays clear
- DNA: Genre, architectural tone, cultural tone, mood baseline, palette bias
- WEATHER: Current weather conditions remain the same

FLEXIBLE (creative freedom):
- MATERIALS: Parent materials are INSPIRATION, not restriction
- Introduce CONTRASTING materials that complement the mood (smooth vs rough, organic vs synthetic, light vs heavy, transparent vs opaque)
- Add UNEXPECTED features: water where there was metal, vegetation where there was stone, glass where there was wood, fabric where there was rock
- Scale can vary dramatically: intimate details alongside monumental features
- Lighting SOURCE can vary: if parent had LED lights, try fire bowls, bioluminescence, spotlights, reflective surfaces - BUT maintain same time-of-day lighting quality
- 1-3 elements can be completely new material types not in parent

Pattern: If parent has [X material in Y environment at Z time], niche has [completely different materials] but still in [Y environment at Z time]
Examples: 
- Metal sculptures in desert twilight → Glass pools + wooden platforms in SAME desert twilight
- Stone temple in misty forest → Crystal formations + bioluminescent vegetation in SAME misty forest
- Burning Man principle: Different art, same playa, same atmosphere`;
  }
}

const exteriorSpecificInstructions = `
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

CREATIVE NICHE GENERATION (CRITICAL):
- The parent sets the THEME (materials, mood, style, colors, DNA)
- The niche should contain NEW elements that fit this theme but are DISTINCT
- Think: variations, extensions, related features - NOT copies of the parent
- Add creative details that weren't mentioned in the parent description
- The space should feel like a DISCOVERY, not just another view of the same thing

Principles of creative variation (learn the concept, don't copy examples):
- Parent provides MATERIALS → Niche adds new structures/features using those same materials in different forms
- Parent establishes SCALE → Niche includes varied-scale elements (smaller, larger, grouped, scattered)
- Parent sets LIGHTING STYLE → Niche extends that lighting in new creative ways
- Parent defines TERRAIN/FORM → Niche adds new ground/surface features fitting that context
- Parent shows PRIMARY FEATURE → Niche introduces complementary secondary features, interaction points, exploration elements

General pattern to follow:
If parent has [X primary element with Y materials], the niche should add related but NEW elements using Y materials in different configurations, scales, or functions that invite further exploration

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

`

const interiorSpecificInstructions = `
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

CREATIVE NICHE GENERATION (CRITICAL):
- The parent sets the THEME (materials, mood, style, colors, DNA)
- The niche should contain NEW elements that fit this theme but are DISTINCT
- Think: variations, extensions, related features - NOT copies of the parent
- Add creative details that weren't mentioned in the parent description
- The space should feel like a DISCOVERY, not just another view of the same thing

Principles of creative variation (learn the concept, don't copy examples):
- Parent provides MATERIALS → Niche adds new structures/features using those same materials in different forms
- Parent establishes SCALE → Niche includes varied-scale elements (smaller, larger, grouped, scattered)
- Parent sets LIGHTING STYLE → Niche extends that lighting in new creative ways
- Parent defines FORM → Niche adds new architectural features fitting that form
- Parent shows PRIMARY FEATURE → Niche introduces complementary secondary features, interaction points, exploration elements

General pattern to follow:
If parent has [X primary element with Y materials], the niche should add related but NEW elements using Y materials in different configurations, scales, or functions that invite further exploration

BEFORE creating the interior, infer it from the parent structure:

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

5. COMPOSITION (MUST include NAVIGABLE ELEMENTS *inside* these layers)
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

`

/**
 * Generate prompt for LLM to create FLUX image description
 * for stepping inside a location
 * @param creativityLevel 0.0 (conservative) to 1.0 (bold) - controls how much the niche diverges from parent
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  creativityLevel: number = 0.5
): string {
  // Build dynamic instructions based on creativity level
  const dynamicCreativityInstructions = getCreativityInstructions(creativityLevel);
  
  // Replace static creativity sections with dynamic ones
  const exteriorInstructions = exteriorSpecificInstructions.replace(
    /CREATIVE NICHE GENERATION \(CRITICAL\):[\s\S]*?(?=BEFORE creating the exterior niche)/,
    dynamicCreativityInstructions + '\n\n'
  );
  
  const interiorInstructions = interiorSpecificInstructions.replace(
    /CREATIVE NICHE GENERATION \(CRITICAL\):[\s\S]*?(?=BEFORE creating the interior)/,
    dynamicCreativityInstructions + '\n\n'
  );
  
  const prompt = `
You are an expert at creating image prompts for FLUX image generation.

TASK: Create an image prompt for ${intent.intent} "${context.currentNode.name}".

PARENT STRUCTURE ANALYSIS (CRITICAL):
You entered through: "${decision.reasoning}"

${context.currentNode.data.looks ? `Parent structure appearance: "${context.currentNode.data.looks}"` : ''}

${intent.spaceType === 'interior' ? interiorInstructions : intent.spaceType === 'exterior' ? exteriorInstructions : ''}
  
You should create a ${intent.spaceType} niche ${intent.spaceType === 'exterior' ? 'within' : 'inside'} ${context.currentNode.name} that has the following features:

${context.currentNode.data.description ? `Description: ${context.currentNode.data.description}` : ''}
${context.currentNode.data.looks ? `Looks: ${context.currentNode.data.looks}` : ''}
${context.currentNode.data.dominantElements ? `Dominant elements of : ${context.currentNode.data.dominantElements.join(', ')}` : ''}
${context.currentNode.data.spatialLayout ? `Spatial Layout: ${context.currentNode.data.spatialLayout}` : ''}
${context.currentNode.data.uniqueIdentifiers ? `Unique Identifiers: ${context.currentNode.data.uniqueIdentifiers.join(', ')}` : ''}
Materials: ${[
    context.currentNode.data.materials_primary,
    context.currentNode.data.materials_secondary,
    context.currentNode.data.materials_accents
  ]
    .filter(Boolean)
    .join(', ') || ''}
    
Colors: ${[
    context.currentNode.data.colors_dominant,
    context.currentNode.data.colors_secondary,
    context.currentNode.data.colors_accents,
    context.currentNode.data.colors_ambient 
  ]
    .filter(Boolean)
    .join(', ') || ''}

${context.currentNode.dna.genre ? `Genre: ${context.currentNode.dna.genre}` : ''}
${context.currentNode.dna.architectural_tone ? `Architectural Tone: ${context.currentNode.dna.architectural_tone}` : ''}
${context.currentNode.dna.cultural_tone ? `Cultural Tone: ${context.currentNode.dna.cultural_tone}` : ''}
${context.currentNode.dna.materials_base ? `Materials Base: ${context.currentNode.dna.materials_base}` : ''}
${context.currentNode.dna.mood_baseline ? `Mood Baseline: ${context.currentNode.dna.mood_baseline}` : ''}
${context.currentNode.dna.palette_bias ? `Palette Bias: ${context.currentNode.dna.palette_bias}` : ''}
${context.currentNode.dna.flora_base ? `Flora Base: ${context.currentNode.dna.flora_base}` : ''}
${context.currentNode.dna.fauna_base ? `Fauna Base: ${context.currentNode.dna.fauna_base}` : ''}

${fluxInstructionsShort}

${intent.spaceType === 'exterior' ? `
REQUIREMENTS (EXTERIOR NICHE - CRITICAL):
1. You have STEPPED THROUGH/WITHIN the outdoor installation. You are OUTSIDE in the open air.
2. SKY MUST BE VISIBLE - this is an EXTERIOR space with open sky above, not an enclosed interior.
3. Maintain OUTDOOR ATMOSPHERE - horizon line visible, natural outdoor lighting (sun/moon/stars), open air.
4. The installation/structure exists around you but does NOT enclose you with walls and ceiling - you can see through/past it to the surrounding outdoor environment.
5. Think: You walked through an outdoor archway/sculpture in a desert/park/plaza - you're still outside, not in a building.
6. Include interesting outdoor navigation details (paths, platforms, other installations) based on the data.
7. The image should be interesting and visually rich, make it unsymmetrical and dynamic.

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe the outdoor area you now stand within.

` : 

`
REQUIREMENTS (INTERIOR NICHE):
1. Imagine what it looks like when we JUST STEPPED INSIDE through the entrance, don't show what you stepped in from like the door, gate etc. That's supposed to be behind the viewer. Show the immediate enclosed space.
2. This is an INTERIOR space - enclosed with ceiling/roof overhead, walls surrounding.
3. Include interesting navigation details (doors, stairs, passages, rooms, paintings etc) if suitable based on the data, be creative.
4. The image should be interesting and visually rich, make it unsymmetrical and dynamic.

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`}`;

  console.log('\n\n##################### NICHE IMAGE PROMPT MAKER  #####################');
  console.log(prompt);
  console.log('##################### NICHE IMAGE PROMPT MAKER END  #####################\n\n');

  return prompt;
}
