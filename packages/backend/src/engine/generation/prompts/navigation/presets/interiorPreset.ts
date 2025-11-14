import type { NavigationContext } from '../../../../navigation/types';
import { fluxRoofFix } from '../../shared/constants';
import {
  buildCompositionLayeringCondensed,
  buildInteriorSpaceRulesCondensed,
  buildNavigableElementsInstructionsCondensed,
  buildNavigationGuidanceCondensed,
  buildParentStructureAnalysis,
  buildPerspectiveFramingCondensed,
  buildRequirementsCondensed,
  buildTransformationRulesCondensed,
  extractEntranceElement,
} from '../../shared/promptSections';
import type { IntentResult, NavigationDecision } from '../../../../navigation/types';

/**
 * Adds interior-specific sections to the base niche prompt.
 */
export function applySpaceTypePreset(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string,
  spaceType: 'interior' | 'exterior' = 'interior'
): { preContext: string; postContext: string } {
  const entranceElement = extractEntranceElement(decision.reasoning);
  const perspectiveNote =
    spaceType === 'exterior'
      ? 'NOTE: Describe the space from just inside the threshold, facing outward, keeping exterior elements controlled.'
      : 'NOTE: You are already inside – focus on enclosed spatial cues.';
  const parentAnalysis = buildParentStructureAnalysis(
    entranceElement,
    context.currentNode.data.looks
  );
  const navigationGuidance = buildNavigationGuidanceCondensed(navigationFeatures);
  const composition = buildCompositionLayeringCondensed();
  const requirements = buildRequirementsCondensed();
  const navigableInstructions = buildNavigableElementsInstructionsCondensed();
  const transformation = buildTransformationRulesCondensed();
  const perspectiveFraming = buildPerspectiveFramingCondensed();
  const interiorSpaceRules = buildInteriorSpaceRulesCondensed(entranceElement);

  const preContext = `${parentAnalysis}

${perspectiveNote}

${fluxRoofFix}

${perspectiveFraming}

${transformation}

${interiorSpaceRules}`;

  const postContext = `${navigationGuidance}

${composition}

${requirements}

${navigableInstructions}`;

  return { preContext, postContext };
}
