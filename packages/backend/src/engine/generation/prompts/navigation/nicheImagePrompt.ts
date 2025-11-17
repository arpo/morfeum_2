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
- Reflect the dominant dimension (height/width/depth).
- If exterior dimensions are known, interior height = 40–60% of total.
- For houses: infer realistic interior style (flooring, materials, furniture) from exterior cues.

4. STRUCTURE TYPE (affects how you fill foreground/midground/background):
- Vertical (towers/spires): emphasize height, upward depth, towering vertical elements.
- Horizontal (halls/corridors): emphasize long linear depth and receding perspective.
- Wide (domes/arenas): emphasize circular expanse, open span, and roof curvature.

5. COMPOSITION (ONE unified block)
Create **ONE** Foreground / Midground / Background description, influenced by the structure type above:

[COMPOSITION:]
- **Foreground:**  
  Floor textures, entry-level elements, bases of structures, or first navigable element.  
  Include 1 navigable element here if appropriate (e.g., “stone steps rising left [navigable: stairs, left]”).

- **Midground:**  
  Primary architectural features shaped by FORM + SCALE: columns, walls, curvature, shafts, arches, side features.  
  Add 1 navigable element if suitable (e.g., “arched doorway on right [navigable: door, right wall]”).

- **Background:**  
  The dominant spatial cue based on structure type:  
    • Vertical → soaring ceiling + visible height (specify meters)  
    • Horizontal → long passage or corridor depth (specify meters)  
    • Wide → far curved walls or domed ceiling (specify diameter/height)  
  Add 1 navigable element here if suitable (e.g., “distant platform [navigable: platform, far center]”).

CRITICAL::
6. NAVIGABLE ELEMENTS (required)
- Include 2-3 very clearly visible navigable elements across foreground/midground/background.
- Allowed types: passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object.
- Always write them with clear tags:
  (navigable: type, position)

The interior architecture MUST directly reflect FORM and SCALE from the analysis above.


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

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;

  console.log('\n\n##################### NICHE IMAGE PROMPT MAKER  #####################');
  console.log(prompt);
  console.log('##################### NICHE IMAGE PROMPT MAKER END  #####################\n\n');

  return prompt;
}

