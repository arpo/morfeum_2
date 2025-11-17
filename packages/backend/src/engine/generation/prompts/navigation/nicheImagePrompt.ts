/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

import type { NavigationContext, IntentResult, NavigationDecision } from '../../../navigation/types';
import { fluxInstructionsShort } from '../shared/constants';

const interiorSpecificInstructions = `
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
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision
): string {
  const prompt = `
You are an expert at creating image prompts for FLUX image generation.

TASK: Create an image prompt for ${intent.intent} "${context.currentNode.name}".

PARENT STRUCTURE ANALYSIS (CRITICAL):
You entered through: "${decision.reasoning}"

${context.currentNode.data.looks ? `Parent structure appearance: "${context.currentNode.data.looks}"` : ''}

${intent.spaceType === 'interior' ? interiorSpecificInstructions : ''}
  
You should create a ${intent.spaceType} niche inside ${context.currentNode.name} that has the following features:

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

REQUIREMENTS:
1. Imagine what it looks like when we JUST STEPPED INSIDE through the entrance, don't show what you stepped in form like the door, gate etc. Thats supposed to be behind the viewer. Show the immediate space.
3. Include interesting navigation details (doors, stairs, passages, rooms, paintings etc) if suitable based on the data, be creative.
4. The image should be interesting and visually rich make it unsymmetrical and dynamic.

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;

  console.log('\n\n##################### NICHE IMAGE PROMPT MAKER  #####################');
  console.log(prompt);
  console.log('##################### NICHE IMAGE PROMPT MAKER END  #####################\n\n');

  return prompt;
}
