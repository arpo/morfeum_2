import type { IntentResult, NavigationContext, NavigationDecision } from '../../../../navigation/types';
import { buildExteriorPresetSections } from './exteriorPreset';
import { buildInteriorPresetSections } from './interiorPreset';

export type SpaceType = 'interior' | 'exterior';

export function buildSpaceTypePresetSections(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string,
  spaceType: SpaceType = 'interior'
): string {
  if (spaceType === 'exterior') {
    return buildExteriorPresetSections(context, intent, decision, navigationFeatures);
  }

  return buildInteriorPresetSections(context, intent, decision, navigationFeatures);
}
