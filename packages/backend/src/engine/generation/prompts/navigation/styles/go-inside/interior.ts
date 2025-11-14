/**
 * Interior Adaptation
 * Wraps generic nicheImagePrompt with interior-specific structural rules
 * DNA descriptors still drive the visual style
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../../../../../navigation/types';
import { nicheImagePrompt } from '../../nicheImagePrompt';
import {
  extractEntranceElement,
  buildInteriorSpaceRulesCondensed,
  buildPerspectiveFramingCondensed,
  buildTransformationRulesCondensed,
} from '../../../shared/promptSections';

/**
 * Interior adaptation - adds structural rules for enclosed spaces
 * Wraps the generic foundation
 */
export function interiorAdaptation(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  // Extract entrance element for interior-specific sections
  const entranceElement = extractEntranceElement(decision.reasoning);
  
  // Build interior-specific structural sections
  const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOU ARE INSIDE: ${entranceElement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  const interiorRules = buildInteriorSpaceRulesCondensed(entranceElement);
  const perspective = buildPerspectiveFramingCondensed();
  const transformRules = buildTransformationRulesCondensed();
  
  // Call generic foundation (DNA-driven)
  const foundation = nicheImagePrompt(context, intent, decision, navigationFeatures);
  
  // Combine: Interior structure + foundation
  return `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

${header}

${interiorRules}

${perspective}

${transformRules}

${foundation}`;
}
