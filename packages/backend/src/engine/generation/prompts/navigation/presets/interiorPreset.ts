import type { NavigationContext } from '../../../../navigation/types';
import {
  buildCompositionLayeringCondensed,
  buildInteriorSpaceRulesCondensed,
  buildNavigationGuidanceCondensed,
  buildParentStructureAnalysis,
  buildPerspectiveFramingCondensed,
  buildRequirementsCondensed,
  buildTransformationRulesCondensed,
  extractEntranceElement,
} from '../../shared/promptSections';
import type { IntentResult, NavigationDecision } from '../../../../navigation/types';

/**
 * Interior preset builders avoid hard-coded scenery by relying on shared sections and the parent context.
 */
export function buildInteriorPresetSections(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision
): string {
  const entranceElement = extractEntranceElement(decision.reasoning);
  const locationLooks = context.currentNode.data.looks;
  const structureAnalysis = buildParentStructureAnalysis(
    entranceElement,
    locationLooks
  );
  const compositionLayering = buildCompositionLayeringCondensed();
  const perspectiveFraming = buildPerspectiveFramingCondensed();
  const transformationRules = buildTransformationRulesCondensed();
  const requirements = buildRequirementsCondensed();
  const interiorSpaceRules = buildInteriorSpaceRulesCondensed(entranceElement);
  const navigationGuidance = buildNavigationGuidanceCondensed();

  return `${structureAnalysis}

${compositionLayering}

${perspectiveFraming}

${transformationRules}

${requirements}

${interiorSpaceRules}

${navigationGuidance}`;
}
