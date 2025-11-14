/**
 * Niche Image Prompt Generation (Foundation)
 * Generic prompt generator for niche and similar interior scenes.
 * DNA descriptors drive the visual style and atmosphere.
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../../../navigation/types';
import { buildNichePromptBase } from './nichePromptBase';
import { applySpaceTypePreset } from './presets/interiorPreset';
import { buildLocationDescriptors, buildMaterialsDescription, buildColorsDescription, buildDNADescriptors } from '../shared/contextBuilders';

/**
 * Generate prompt for LLM to create FLUX image description
 * Combines the neutral base plus space-type specific preset sections.
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string,
  spaceType: 'interior' | 'exterior' = 'interior'
): string {
  const basePrompt = buildNichePromptBase(context);
  const { preContext, postContext } = applySpaceTypePreset(
    context,
    intent,
    decision,
    navigationFeatures,
    spaceType
  );

  const descriptors = buildLocationDescriptors(context.currentNode.data);
  const materials = buildMaterialsDescription(context.currentNode.data);
  const colors = buildColorsDescription(context.currentNode.data);
  const dnaDescriptors = buildDNADescriptors(context.currentNode.dna);

  const prompt = `${preContext}

PARENT LOCATION CONTEXT:
Name: "${context.currentNode.name}"
${descriptors.join('\n')}
${materials ? `\n${materials}` : ''}
${colors ? `\n${colors}` : ''}
${context.currentNode.data.spatialLayout ? `\nSpatial Layout: "${context.currentNode.data.spatialLayout}"` : ''}

${dnaDescriptors.length > 0 ? `DNA GUIDANCE (PRIMARY - use this to drive style & atmosphere):\n${dnaDescriptors.join('\n')}` : ''}

${basePrompt}

${postContext}

OUTPUT: Return a detailed image prompt for FLUX with clear foreground/midground/background organization and inline navigable element markers.`;
  
  console.log('##################### LLM prompt #####################');
  console.log(prompt);
  console.log('##################### LLM prompt End #####################');

  return prompt;
}
