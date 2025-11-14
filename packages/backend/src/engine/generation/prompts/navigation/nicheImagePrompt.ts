/**
 * Niche Image Prompt Generation (Foundation)
 * Generic prompt foundation for creating niche spaces (GO_INSIDE)
 * DNA descriptors drive the visual style and atmosphere
 * 
 * This is a FOUNDATION - specific behaviors can be added via style registry
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../../../navigation/types';
import { fluxInstructionsShort } from '../shared/constants';
import {
  buildColorsDescription,
  buildDNADescriptors,
  buildLocationDescriptors,
  buildMaterialsDescription,
} from '../shared/contextBuilders';
import {
  extractEntranceElement,
  buildParentStructureAnalysis,
  buildNavigationGuidanceCondensed,
  buildCompositionLayeringCondensed,
  buildNavigableElementsInstructionsCondensed,
  buildRequirementsCondensed,
  buildCameraSpecificationsCondensed,
} from '../shared/promptSections';

/**
 * Generate prompt for LLM to create FLUX image description
 * DNA-driven, generic foundation for niche spaces
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  // Build context from location data
  const descriptors = buildLocationDescriptors(context.currentNode.data);
  const materials = buildMaterialsDescription(context.currentNode.data);
  const colors = buildColorsDescription(context.currentNode.data);
  
  // DNA descriptors are the PRIMARY DRIVER of style/atmosphere
  const dnaDescriptors = buildDNADescriptors(context.currentNode.dna);

  // Extract entrance element from decision reasoning
  const entranceElement = extractEntranceElement(decision.reasoning);
  
  // Build all sections (always condensed)
  const parentAnalysis = buildParentStructureAnalysis(entranceElement, context.currentNode.data.looks);
  const navigationGuidance = buildNavigationGuidanceCondensed(navigationFeatures);
  const composition = buildCompositionLayeringCondensed();
  const requirements = buildRequirementsCondensed();
  const navigableInstructions = buildNavigableElementsInstructionsCondensed();
  const cameraSpecs = buildCameraSpecificationsCondensed();

  const prompt = `${parentAnalysis}

PARENT LOCATION CONTEXT:
Name: "${context.currentNode.name}"
${descriptors.join('\n')}
${materials ? `\n${materials}` : ''}
${colors ? `\n${colors}` : ''}
${context.currentNode.data.spatialLayout ? `Spatial Layout: "${context.currentNode.data.spatialLayout}"` : ''}

${dnaDescriptors.length > 0 ? `DNA GUIDANCE (PRIMARY - use this to drive style & atmosphere):\n${dnaDescriptors.join('\n')}` : ''}

${cameraSpecs}

${fluxInstructionsShort}

${navigationGuidance}

${composition}

${requirements}

${navigableInstructions}

OUTPUT: Return a detailed image prompt for FLUX with clear foreground/midground/background organization and inline navigable element markers.`;

  console.log('##################### LLM prompt #####################');
  console.log(prompt);
  console.log('##################### End LLM prompt #####################');


  return prompt;
}
