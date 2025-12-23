/**
 * Prompt Enhancer Builder
 * 
 * Main function for building enhancement prompts for navigation commands
 */

import {
  navigableElementsInteriorInstructions,
  navigableElementsExteriorInstructions,
  furnishingInstructions,
  exteriorNicheInstructions,
  openAirInstructions,
  facadeInstructions
} from './instructionTemplates';

/**
 * Perspective type for determining which instructions to use
 */
export type EnhancerPerspective = 'interior' | 'exterior' | 'open-air' | 'facade';

/**
 * Build the full enhancer prompt for a given command type
 */
export function buildEnhancerPrompt(
  commandType: 'GO_INSIDE' | 'GOTO' | 'NEW_LOCATION',
  currentNodeContext: {
    name: string;
    type: string;
    description?: string;
    spaceType?: string;
    dna?: any;
    navigableElements?: Array<{ type: string; position: string; description: string }>;
    dominantElements?: string[];
  },
  destinationText: string,
  perspectiveHint?: EnhancerPerspective
): string {
  // Determine the perspective for enhancement suggestions
  const isBuildingFacade = commandType === 'NEW_LOCATION';
  const parentIsExterior = currentNodeContext.spaceType === 'exterior';
  const hasDestination = destinationText && destinationText.trim().length > 0;
  const mainStructure = currentNodeContext.dominantElements?.[0];
  const mainEntrance = currentNodeContext.navigableElements?.[0];
  
  let prompt = `You are an expert at suggesting scene details for image generation.

TASK: Suggest appropriate details to enhance a scene description.

`;

  // If user provided a specific destination, focus on THAT - use location as context only
  if (hasDestination) {
    prompt += `=== TARGET SPACE ===
"${destinationText}"
This is what the user wants to create. Focus your suggestions on THIS space.

=== LOCATION CONTEXT (for style matching) ===
Location: "${currentNodeContext.name}" (${currentNodeContext.type})
${currentNodeContext.dna?.architectural_tone ? `Style: ${currentNodeContext.dna.architectural_tone}` : ''}
${currentNodeContext.dna?.cultural_tone ? `Cultural: ${currentNodeContext.dna.cultural_tone}` : ''}

Your suggestions should match the location's style while being appropriate for "${destinationText}".
`;
  } else {
    // No destination - use existing structure/entrance as target
    prompt += `=== CURRENT LOCATION ===
"${currentNodeContext.name}" (${currentNodeContext.type})
${currentNodeContext.description ? `Description: ${currentNodeContext.description}` : ''}
${currentNodeContext.dna?.architectural_tone ? `Style: ${currentNodeContext.dna.architectural_tone}` : ''}
${currentNodeContext.dna?.cultural_tone ? `Cultural: ${currentNodeContext.dna.cultural_tone}` : ''}
${mainStructure ? `\nMain structure: ${mainStructure}` : ''}
${mainEntrance ? `\nMain entrance: ${mainEntrance.type} at ${mainEntrance.position} - ${mainEntrance.description}` : ''}

The user wants to go inside this location. Suggest details for the interior.
`;
  }

  prompt += `\n=== YOUR TASK ===
`;

  if (isBuildingFacade) {
    // NEW_LOCATION - building facade
    prompt += `
This is a NEW_LOCATION command creating a BUILDING EXTERIOR.
Suggest facade details that would make this building visually interesting.

${facadeInstructions}

${navigableElementsInteriorInstructions}
`;
    prompt += `
=== OUTPUT FORMAT ===
Return a single line that can be appended to the user's command.
Format: "facade: [details], navigable elements: [elements]"

Be specific but concise. Match the style/era of the current location.
`;
  } else if (perspectiveHint === 'exterior' || (parentIsExterior && !hasDestination)) {
    // Exterior niche - fully outdoor space
    prompt += `
This is a ${commandType} command creating a FULLY OUTDOOR space.
This space has NO roof and NO walls - it's completely open to sky and environment.
Suggest terrain, pathways, vegetation, and points of interest.

${exteriorNicheInstructions}

${navigableElementsExteriorInstructions}
`;
    prompt += `
=== OUTPUT FORMAT ===
Return a single line that can be appended to the user's command.
Format: "exterior elements: [items], navigable elements: [elements]"

IMPORTANT: Do NOT use "wall" positions - this is outdoor! Use directional positions instead.
Be specific but concise. Match the style/era of the current location.
`;
  } else if (perspectiveHint === 'open-air') {
    // Open-air niche - semi-enclosed with open sky
    prompt += `
This is a ${commandType} command creating an OPEN-AIR space.
This space has partial walls/railings but open sky above (balcony, terrace, rooftop).
Suggest furnishing that works both indoors and outdoors.

${openAirInstructions}

${navigableElementsInteriorInstructions}
`;
    prompt += `
=== OUTPUT FORMAT ===
Return a single line that can be appended to the user's command.
Format: "open-air elements: [items], navigable elements: [elements]"

Be specific but concise. Match the style/era of the current location.
`;
  } else {
    // Interior niche - default
    prompt += `
This is a ${commandType} command creating an INTERIOR space.
Suggest navigable elements and furnishing appropriate for this space.

${navigableElementsInteriorInstructions}

${furnishingInstructions}
`;
    prompt += `
=== OUTPUT FORMAT ===
Return a single line that can be appended to the user's command.
Format: "navigable elements: [elements], furnish: [items]"

Be specific but concise. Match the style/era of the current location.
`;
  }

  return prompt;
}
