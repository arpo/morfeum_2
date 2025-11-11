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
  // Determine space guidance based on intent classification
  let spaceGuidance = '';
  if (intent.spaceType === 'interior') {
    spaceGuidance = `
CRITICAL: This is an INTERIOR space.
- Show enclosed space with ceiling/roof overhead
- Interior lighting (ambient, artificial light, or light from windows)
- Walls and interior architecture visible
- No open sky visible, unless through windows or openings`;
  } else if (intent.spaceType === 'exterior') {
    spaceGuidance = `
CRITICAL: This is an EXTERIOR space.
- Open-air environment with sky visible
- Natural outdoor lighting (sunlight, ambient outdoor light, atmospheric conditions)
- Landscape or outdoor architectural elements
- No ceiling/roof unless it's an open structure (pergola, pavilion, etc.)`;
  } else {
    spaceGuidance = `Based on the description below, determine if this is an interior or exterior space and maintain strict consistency throughout the image.`;
  }

  // Build descriptors only from non-empty values
  const descriptors: string[] = [];
  
  if (context.currentNode.data.description) {
    descriptors.push(`Description: ${context.currentNode.data.description}`);
  }
  
  if (context.currentNode.data.looks) {
    descriptors.push(`Visual Character: ${context.currentNode.data.looks}`);
  }
  
  if (context.currentNode.data.dominantElements && context.currentNode.data.dominantElements.length > 0) {
    descriptors.push(`Dominant Elements: ${context.currentNode.data.dominantElements.join(', ')}`);
  }
  
  if (context.currentNode.data.spatialLayout) {
    descriptors.push(`Spatial Layout: ${context.currentNode.data.spatialLayout}`);
  }
  
  if (context.currentNode.data.uniqueIdentifiers && context.currentNode.data.uniqueIdentifiers.length > 0) {
    descriptors.push(`Unique Identifiers: ${context.currentNode.data.uniqueIdentifiers.join(', ')}`);
  }
  
  // Build materials description
  const materials = [
    context.currentNode.data.materials_primary,
    context.currentNode.data.materials_secondary,
    context.currentNode.data.materials_accents
  ].filter(Boolean);
  if (materials.length > 0) {
    descriptors.push(`Materials: ${materials.join(', ')}`);
  }
  
  // Build colors description
  const colors = [
    context.currentNode.data.colors_dominant,
    context.currentNode.data.colors_secondary,
    context.currentNode.data.colors_accents,
    context.currentNode.data.colors_ambient
  ].filter(Boolean);
  if (colors.length > 0) {
    descriptors.push(`Colors: ${colors.join(', ')}`);
  }
  
  // Build DNA context if available
  const dnaDescriptors: string[] = [];
  if (context.currentNode.dna) {
    if (context.currentNode.dna.genre) dnaDescriptors.push(`Genre: ${context.currentNode.dna.genre}`);
    if (context.currentNode.dna.architectural_tone) dnaDescriptors.push(`Architectural Tone: ${context.currentNode.dna.architectural_tone}`);
    if (context.currentNode.dna.cultural_tone) dnaDescriptors.push(`Cultural Tone: ${context.currentNode.dna.cultural_tone}`);
    if (context.currentNode.dna.materials_base) dnaDescriptors.push(`Materials Base: ${context.currentNode.dna.materials_base}`);
    if (context.currentNode.dna.mood_baseline) dnaDescriptors.push(`Mood Baseline: ${context.currentNode.dna.mood_baseline}`);
    if (context.currentNode.dna.palette_bias) dnaDescriptors.push(`Palette Bias: ${context.currentNode.dna.palette_bias}`);
    if (context.currentNode.dna.flora_base) dnaDescriptors.push(`Flora Base: ${context.currentNode.dna.flora_base}`);
    if (context.currentNode.dna.fauna_base) dnaDescriptors.push(`Fauna Base: ${context.currentNode.dna.fauna_base}`);
  }

  // Build task description based on space type
  let taskDescription = '';
  if (intent.spaceType === 'interior') {
    taskDescription = `You have just stepped INSIDE through the entrance. You are now in an INTERIOR SPACE.
Based on the parent location details above, IMAGINE and describe what this interior space looks like.`;
  } else if (intent.spaceType === 'exterior') {
    taskDescription = `You have just stepped INSIDE through the entrance. You are now in an EXTERIOR SPACE (like a park, courtyard, or open area).
Based on the parent location details above, IMAGINE and describe what this exterior space looks like.`;
  } else {
    taskDescription = `You have just stepped through the entrance into a new space.
Based on the parent location details above, determine if this is an interior or exterior space, then IMAGINE and describe what it looks like.`;
  }

  const prompt = `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

PARENT LOCATION (where you were standing):
Name: "${context.currentNode.name}"
${descriptors.join('\n')}

${dnaDescriptors.length > 0 ? `INHERITED STYLE & ATMOSPHERE (use as guidance):\n${dnaDescriptors.join('\n')}` : ''}

YOUR TASK:
${taskDescription}

CRITICAL INSTRUCTIONS:
${spaceGuidance}

PERSPECTIVE & FRAMING:
- Camera position: 2-3 meters inside the entrance, facing inward into the interior space
- The entrance is BEHIND the camera - do not show it
- Show what lies ahead in the interior
- Camera: Wide-angle view (24-35mm equivalent), eye-level to slightly elevated

HOW TO USE PARENT LOCATION DETAILS:
- Use materials, colors, and architectural style as HINTS for the interior
- DO NOT literally recreate the exterior scene indoors
- Imagine what the INTERIOR would logically look like based on exterior clues
- Example: Exterior shows "weathered metal cylinders" → Interior might have "corroded metal walls and industrial architecture"

${fluxInstructionsShort}

REQUIREMENTS:
1. The entrance/threshold is BEHIND the camera - show only what lies ahead in the space
2. Include interesting navigation details (doorways, passages, architectural features, objects) if suitable
3. Maintain consistent space type (interior OR exterior, no mixing)
4. Use diagonal composition with depth

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;

  console.log(
    '\n\n-------- Prompt-----------\n', 
    prompt, 
    '\n-------------------------\n\n'
  );
  return prompt;
}
