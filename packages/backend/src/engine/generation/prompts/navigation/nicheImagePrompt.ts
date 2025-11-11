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

  // Extract entrance element from decision.reasoning
  // Example: "Creating interior niche based on Massive cylindrical structures (midground/background) in The Pollen Vents"
  // Extract: "Massive cylindrical structures"
  let entranceElement = 'this structure';
  if (decision.reasoning) {
    const match = decision.reasoning.match(/based on (.+?) (?:\(|in)/i);
    if (match && match[1]) {
      entranceElement = match[1].trim();
    }
  }

  const prompt = `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOU ARE INSIDE: ${entranceElement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an INTERIOR space - you are literally INSIDE the structure mentioned above.
The interior architecture MUST reflect the form and nature of what you entered.

ARCHITECTURAL FORM MATCHING (CRITICAL):
You entered through: "${entranceElement}"

Your interior architecture MUST match this form:
- Cylindrical/tube-like structure → Curved cylindrical walls and ceiling (like being inside a pipe/cylinder)
- Rectangular building → Straight walls with corners and flat ceiling
- Dome/spherical structure → Curved ceiling overhead, circular floor plan
- Cave/natural formation → Organic irregular rock formations
- Arch/archway → Arched ceiling and supports

The interior should feel like being INSIDE the specific structure type mentioned above.

PARENT LOCATION CONTEXT (reference for materials/style only):
Name: "${context.currentNode.name}"
${descriptors.join('\n')}

${dnaDescriptors.length > 0 ? `INHERITED STYLE & ATMOSPHERE (use as guidance):\n${dnaDescriptors.join('\n')}` : ''}

CRITICAL - THIS IS AN INTERIOR SPACE:
- Show enclosed space with ceiling/roof overhead
- Interior lighting (ambient, artificial light, or light from windows/vents)
- Walls and interior architecture visible
- No open sky visible (unless through small windows/openings)
- Interior architecture must match the form of "${entranceElement}"

PERSPECTIVE & FRAMING:
- Camera position: Just past the entrance threshold (1-2 meters inside)
- View: Straight ahead showing the immediate entry view - what you first see when stepping in
- Composition: Entrance-view perspective with slight asymmetry for visual interest
  * Avoid extreme diagonal offset or purely symmetric tunnel view
  * Main space/path visible ahead with interesting details on sides for depth
- Camera: Wide-angle (24-35mm equivalent), eye-level
- The entrance is BEHIND the camera - do not show it

HOW TO USE PARENT LOCATION DETAILS - CRITICAL TRANSFORMATION RULES:

✓ INCLUDE (transformed for interior):
- Materials & colors → Apply to interior surfaces, walls, ceiling, floor
- Architectural style → Adapt to interior architecture and structure
- Atmosphere & mood → Maintain similar emotional feel
- Lighting hints → Transform to interior light sources

✗ DO NOT INCLUDE (unless contextually logical):
- Exterior waterways/streams → Only if it's a logical interior feature (fountain, pool, drainage channel)
- Overgrown vegetation → Only sparse interior plants if contextually appropriate (hydroponics, garden room, etc.)
- Open landscapes → Replace with enclosed spatial elements
- Sky/outdoor ambient light → Transform to interior lighting sources (fixtures, windows, bioluminescence)
- Weather elements (mist, fog) → Only if it makes sense indoors (steam, smoke from vents, etc.)

REASONING TEST: For each parent element, ask "Would this logically exist inside this structure?"

${fluxInstructionsShort}

EXPLORATION & NAVIGATION (context-dependent):
- If space description suggests it's exploratory/transitional: show clear walkable path forward with depth
- If space description suggests it's a dead-end/terminal room: focus on the contained space itself
- Navigation features (doorways, passages, stairs, architectural details) should only be included IF contextually appropriate
  * Include when: space suggests progression, multiple rooms, corridors, complexity
  * Omit when: space is clearly a dead-end chamber, small alcove, confined terminal room
- Create sense of depth and spatial interest appropriate to the space type

REQUIREMENTS:
1. The entrance/threshold is BEHIND the camera - show the immediate entry view
2. Maintain consistent space type (interior OR exterior, no mixing)
3. Only include elements that would logically exist in this type of space (use transformation rules above)
4. Composition should be engaging with slight asymmetry, avoiding both extreme offset and pure symmetry

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;

  console.log(
    '\n\n-------- Prompt-----------\n', 
    prompt, 
    '\n-------------------------\n\n'
  );
  return prompt;
}
