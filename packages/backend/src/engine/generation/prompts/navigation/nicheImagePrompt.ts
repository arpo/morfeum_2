/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

import type { NavigationContext, IntentResult, NavigationDecision } from '../../../navigation/types';
import { fluxInstructionsShort } from '../shared/constants';

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

BEFORE creating the interior, analyze the parent structure's FORM:

1. SHAPE ANALYSIS
   What is the overall geometric form?
   - Circular/round → Interior must have circular floor plan
   - Rectangular/square → Interior must have straight walls with corners
   - Cylindrical/tubular → Interior must have curved walls (like inside a pipe)
   - Geodesic/faceted → Interior must show geometric framework
   - Irregular/organic → Interior must have natural, uneven surfaces

2. CEILING/ROOF ANALYSIS
   What type of ceiling would this structure have inside?
   - Domed roof → Domed ceiling overhead
   - Flat roof → Flat ceiling
   - Vaulted roof → Vaulted ceiling
   - Peaked/pitched roof → Angled ceiling following roof line
   - Geodesic dome → Visible geodesic framework overhead
   - Arched structure → Arched ceiling

3. SCALE & PROPORTION (CRITICAL)
   Extract dimensions from Spatial Layout if provided (e.g., "80-100m tall, 40m diameter")
   Apply proportional interior scale:
   
   - Compact/small (< 15m) → Intimate interior (3-5m ceilings, walls 3-8m apart)
   - Large/expansive (15-50m) → Spacious interior (8-15m ceilings, walls 10-20m apart)
   - Towering/colossal (> 50m) → Vast interior (20m+ ceilings, walls 20m+ apart, visible depth 40m+)

   Dimensional Guidelines:
   Witch dimension is the largest? Depth / Height / Width?
   If a building is very tall, interior height should reflect that.
   If a building is very wide, interior width should reflect that.
   
   MANDATORY for colossal structures (> 50m):
   - Specify ceiling height in meters (e.g., "vaulted ceiling soaring 40m overhead")
   - Specify wall distances (e.g., "walls stretching 25m to either side")
   - Include massive structural elements (e.g., "8m tall stone blocks," "towering 15m columns")
   - Emphasize depth and distance (e.g., "passage extending 50m into darkness")
   - Use scale-reinforcing language: "towering," "vast," "immense," "soaring," "colossal"
   
   If structure dimensions are provided (e.g., "80m tall"), interior ceiling should be 40-60% of total height.

CRITICAL: The interior architecture MUST directly reflect these analyzed characteristics.
You are literally INSIDE the structure described above.

You should create a niche inside ${context.currentNode.name} that has the following features:

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
1. Imagine what it looks like when we JUST STEPPED INSIDE through the entrance, don't show what you stepped in form like the door, gate etc. Thats supposed to be behind the viewer. Show the immediate interior space.
3. Include interesting navigation details (doors, stairs, passages, rooms, paintings etc) if suitable based on the data, be creative.
4. If the description describes an interior space make sure its an interior space, the same for exterior spaces, Don't mix them and create a hybrid unless the description explicitly calls for it.

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;

  console.log('\n\n##################### NICHE IMAGE PROMPT MAKER  #####################');
  console.log(prompt);
  console.log('##################### NICHE IMAGE PROMPT MAKER END  #####################\n\n');

  return prompt;
}

