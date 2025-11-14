import type { IntentResult, NavigationContext, NavigationDecision } from '../../../../navigation/types';
import { buildExteriorPresetSections } from './exteriorPreset';
import { buildInteriorPresetSections } from './interiorPreset';

export type SpaceType = 'interior' | 'exterior';

export function buildSpaceTypePresetSections(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  spaceType: SpaceType = 'interior'
): string {
  if (spaceType === 'exterior') {
    return buildExteriorPresetSections(context, intent, decision);
  }

  return buildInteriorPresetSections(context, intent, decision);
}
