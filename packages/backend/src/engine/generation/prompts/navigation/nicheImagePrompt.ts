/**
 * Niche Image Prompt Generation (Foundation)
 * Generic prompt generator for niche and similar interior scenes.
 * DNA descriptors drive the visual style and atmosphere.
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../../../navigation/types';
import { buildNichePromptBase } from './nichePromptBase';
import { buildSpaceTypePresetSections } from './presets/spaceTypePresets';

/**
 * Generate prompt for LLM to create FLUX image description
 * Combines the neutral base plus space-type specific preset sections.
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  spaceType: 'interior' | 'exterior' = 'interior'
): string {
  const basePrompt = buildNichePromptBase(context);
  const presetNarrative = buildSpaceTypePresetSections(
    context,
    intent,
    decision,
    spaceType
  );

  const prompt = `${presetNarrative}

${basePrompt}

OUTPUT: Return a detailed image prompt for FLUX with clear foreground/midground/background organization and inline navigable element markers.`;
  
  console.log('##################### LLM prompt #####################');
  console.log(prompt);
  console.log('##################### LLM prompt End #####################');

  return prompt;
}
