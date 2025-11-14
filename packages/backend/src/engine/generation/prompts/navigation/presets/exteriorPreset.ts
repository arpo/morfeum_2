import type { NavigationContext } from '../../../../navigation/types';
import {
  buildExteriorApproachNote,
  buildExteriorSpaceRulesCondensed,
  buildNavigationGuidanceCondensed,
  extractEntranceElement,
} from '../../shared/promptSections';
import type { IntentResult, NavigationDecision } from '../../../../navigation/types';

/**
 * Exterior preset sections rely on the shared approach and rules helpers instead of bespoke verbiage.
 */
export function buildExteriorPresetSections(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision
): string {
  const entranceElement = extractEntranceElement(decision.reasoning);
  const locationLooks = context.currentNode.data.looks;
  const approachNote = buildExteriorApproachNote(locationLooks);
  const exteriorRules = buildExteriorSpaceRulesCondensed(entranceElement);
  const navigationGuidance = buildNavigationGuidanceCondensed();

  return `${approachNote}

${exteriorRules}

${navigationGuidance}`;
}
