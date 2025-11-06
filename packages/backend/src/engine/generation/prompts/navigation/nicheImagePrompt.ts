/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

import type { NavigationContext, IntentResult, NavigationDecision } from '../../../navigation/types';
import { fluxInstructions } from '../shared/constants';

/**
 * Generate prompt for LLM to create FLUX image description
 * for stepping inside a location
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision
): string {
  const prompt = `You are an expert at creating image prompts for FLUX image generation.

TASK: Create an image prompt for ${intent.intent} "${context.currentNode.name}".

${decision.reasoning ? `You should aim to "${decision.reasoning}".` : ''}
The scene can be both interior and exterior depending on the context.
You should create a niche inside ${context.currentNode.name} that has the following features:

Description: ${context.currentNode.data.description || 'N/A'}
Looks: ${context.currentNode.data.looks || 'N/A'}
Dominant elements of : ${context.currentNode.data.dominantElements?.join(', ') || 'N/A'}
Spatial Layout: ${context.currentNode.data.spatialLayout || 'N/A'}
Unique Identifiers: ${context.currentNode.data.uniqueIdentifiers?.join(', ') || 'N/A'}
Materials: ${[
    context.currentNode.data.materials_primary,
    context.currentNode.data.materials_secondary,
    context.currentNode.data.materials_accents
  ]
    .filter(Boolean)
    .join(', ') || 'N/A'}
Colors: ${[
    context.currentNode.data.colors_dominant,
    context.currentNode.data.colors_secondary,
    context.currentNode.data.colors_accents,
    context.currentNode.data.colors_ambient 
  ]
    .filter(Boolean)
    .join(', ') || 'N/A'}

${context.currentNode.dna ? `Genre: ${context.currentNode.dna.genre || 'N/A'}
Architectural Tone: ${context.currentNode.dna.architectural_tone || 'N/A'}
Cultural Tone: ${context.currentNode.dna.cultural_tone || 'N/A'}
Materials Base: ${context.currentNode.dna.materials_base || 'N/A'}
Mood Baseline: ${context.currentNode.dna.mood_baseline || 'N/A'}
Palette Bias: ${context.currentNode.dna.palette_bias || 'N/A'}` : 'N/A'}
Flora and Fauna:
${context.currentNode.dna ? `Flora Base: ${context.currentNode.dna.flora_base || 'N/A'}
Fauna Base: ${context.currentNode.dna.fauna_base || 'N/A'}` : 'N/A'}


The surrounding context (the area just surrounding the location) is as follows.
This is secondary information to help you understand the vibe and setting.

Architectural Tone: ${context.parentNode?.dna?.architectural_tone || 'N/A'}
Cultural Tone: ${context.parentNode?.dna?.cultural_tone || 'N/A'}
Materials Base: ${context.parentNode?.dna?.materials_base || 'N/A'}
Mood Baseline: ${context.parentNode?.dna?.mood_baseline || 'N/A'}
Palette Bias: ${context.parentNode?.dna?.palette_bias || 'N/A'}

Flora and Fauna:
${context.parentNode?.dna ? `Flora Base: ${context.parentNode.dna.flora_base || 'N/A'}
Fauna Base: ${context.parentNode.dna.fauna_base || 'N/A'}` : 'N/A'}

REQUIREMENTS:
1. Imagine what it looks like when we JUST STEPPED INSIDE through the entrance, don't show what you stepped in form like the door, gate etc. Thats supposed to be behind the viewer. Show the immediate interior space.
2. Use first-person interior perspective (medium elevated offset angle, diagonal composition)
3. Include interesting navigation details (doors, stairs, passages, rooms, paintings etc) if suitable based on the data, be creative.
4. If the description describes an interior space make sure its an interior space, the same for exterior spaces, Don't mix them and create a hybrid unless the description explicitly calls for it.

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;

  // console.log(prompt);
  return prompt;
}

