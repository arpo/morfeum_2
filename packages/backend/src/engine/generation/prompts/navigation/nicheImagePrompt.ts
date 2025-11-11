/**
 * Interior Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 * 
 * Refactored to use shared utilities for maintainability
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
  buildNavigationGuidance,
  extractEntranceElement,
  buildParentStructureAnalysis,
  buildInteriorSpaceRules,
  buildPerspectiveFraming,
  buildTransformationRules,
  buildCompositionLayering,
  buildNavigableElementsInstructions,
  buildRequirements,
  buildNavigationGuidanceCondensed,
  buildCompositionLayeringCondensed,
  buildNavigableElementsInstructionsCondensed,
  buildPerspectiveFramingCondensed,
  buildTransformationRulesCondensed,
  buildRequirementsCondensed,
  buildInteriorSpaceRulesCondensed,
} from '../shared/promptSections';

/**
 * Generate prompt for LLM to create FLUX image description
 * for stepping inside a location
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string,
  mode: 'detailed' | 'condensed' = 'condensed'
): string {
  // Build context using shared utilities
  const descriptors = buildLocationDescriptors(context.currentNode.data);
  const materials = buildMaterialsDescription(context.currentNode.data);
  const colors = buildColorsDescription(context.currentNode.data);
  const dnaDescriptors = buildDNADescriptors(context.currentNode.dna);
  
  // Combine all descriptors
  const allDescriptors = [
    ...descriptors,
    materials,
    colors,
  ].filter(Boolean);

  // Extract entrance element
  const entranceElement = extractEntranceElement(decision.reasoning);
  
  // Build all prompt sections using shared utilities (condensed or detailed based on mode)
  const parentAnalysis = buildParentStructureAnalysis(entranceElement, context.currentNode.data.looks);
  const interiorRules = mode === 'condensed' 
    ? buildInteriorSpaceRulesCondensed(entranceElement)
    : buildInteriorSpaceRules(entranceElement);
  const perspective = mode === 'condensed' 
    ? buildPerspectiveFramingCondensed()
    : buildPerspectiveFraming();
  const transformRules = mode === 'condensed' 
    ? buildTransformationRulesCondensed()
    : buildTransformationRules();
  const navigationGuidance = mode === 'condensed' 
    ? buildNavigationGuidanceCondensed(navigationFeatures)
    : buildNavigationGuidance(navigationFeatures);
  const composition = mode === 'condensed' 
    ? buildCompositionLayeringCondensed()
    : buildCompositionLayering('interior');
  const requirements = mode === 'condensed' 
    ? buildRequirementsCondensed()
    : buildRequirements();
  const navigableInstructions = mode === 'condensed' 
    ? buildNavigableElementsInstructionsCondensed()
    : buildNavigableElementsInstructions();

  const prompt = `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOU ARE INSIDE: ${entranceElement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an INTERIOR space - you are literally INSIDE the structure mentioned above.
The interior architecture MUST reflect the form and nature of what you entered.

${parentAnalysis}

PARENT LOCATION CONTEXT (reference for materials/style only):
Name: "${context.currentNode.name}"
${descriptors.join('\n')}

${dnaDescriptors.length > 0 ? `INHERITED STYLE & ATMOSPHERE (use as guidance):\n${dnaDescriptors.join('\n')}` : ''}

${interiorRules}

${perspective}

${transformRules}

${fluxInstructionsShort}
${navigationGuidance}

${composition}

${requirements}

${navigableInstructions}

OUTPUT: Return a detailed image prompt for FLUX with clear foreground/midground/background organization and inline navigable element markers.`;

  console.log(
    '\n\n-------- Prompt-----------\n', 
    prompt, 
    '\n-------------------------\n\n'
  );
  return prompt;
}
