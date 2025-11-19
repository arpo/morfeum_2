/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

import type { NavigationContext, IntentResult, NavigationDecision } from '../../../navigation/types';
import { fluxInstructionsShort } from '../shared/constants';
import { getCreativityInstructions } from './creativityInstructions';
import { exteriorInstructionsTemplate } from './exteriorInstructions';
import { interiorInstructionsTemplate } from './interiorInstructions';

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
  
  // Replace placeholder in templates with dynamic creativity instructions
  const exteriorInstructions = exteriorInstructionsTemplate.replace(
    '{{CREATIVITY_INSTRUCTIONS}}',
    dynamicCreativityInstructions
  );
  
  const interiorInstructions = interiorInstructionsTemplate.replace(
    '{{CREATIVITY_INSTRUCTIONS}}',
    dynamicCreativityInstructions
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
    .join(', ') || context.currentNode.dna.materials_base || ''}
    
Colors: ${[
    context.currentNode.data.colors_dominant,
    context.currentNode.data.colors_secondary,
    context.currentNode.data.colors_accents,
    context.currentNode.data.colors_ambient 
  ]
    .filter(Boolean)
    .join(', ') || context.currentNode.dna.palette_bias || ''}

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
