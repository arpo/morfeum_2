import type { NavigationContext } from '../../../../navigation/types';
import {
  buildNavigationGuidanceCondensed,
  extractEntranceElement,
} from '../../shared/promptSections';
import type { IntentResult, NavigationDecision } from '../../../../navigation/types';

/**
 * Adds space-type specific narrative sections to the base niche prompt.
 */
export function applySpaceTypePreset(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string,
  spaceType: 'interior' | 'exterior' = 'interior'
): string {
  const entranceElement = extractEntranceElement(decision.reasoning);
  const locationLook = context.currentNode.data.looks || context.currentNode.name;
  const atmosphere = 'functional and intentional';
  const perspectiveNote =
    spaceType === 'exterior'
      ? 'The perspective is taken from just inside the threshold, looking outward, keeping exterior elements controlled.'
      : 'The perspective is from 1-2 meters inside, looking straight ahead, wide-angle, eye-level, with the entrance hidden behind the camera.';
  const navigationGuidance = buildNavigationGuidanceCondensed(navigationFeatures);

  const foreground = `**Foreground:** The floor is gritty and utilitarian, featuring the immediate textures of ${locationLook} with scattered tools or equipment suggesting action (navigable: floor area, foreground, ${entranceElement}).`;
  const midground = `**Midground:** Structural walls, rails, or bulkheads rise out of the haze; exposed conduits and functional features unfold with controlled lighting, and a clear passage opens deeper into the scene (navigable: wall detail or passage, midground, ${entranceElement}).`;
  const background = `**Background:** The deeper recesses hold storage, workstations, or shelving, lit by focused pools of light, emphasizing a contained, purposeful workspace beyond the midplane (navigable: storage, background, ${entranceElement}).`;

  return `The interior of ${locationLook} feels ${atmosphere}, with materials tied to its parent form (${entranceElement}) and a sense of deliberate utility.

${perspectiveNote}

${foreground}

${midground}

${background}

${navigationGuidance}`;
}
