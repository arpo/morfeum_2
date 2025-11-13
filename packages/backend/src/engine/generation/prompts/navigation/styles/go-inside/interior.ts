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
  buildParentStructureAnalysis,
  buildCompositionLayeringCondensed,
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
  
  // Use interior-specific prompt sections
  const parentAnalysis = buildParentStructureAnalysis(entranceElement, context.currentNode.data.looks);
  const transformRules = buildTransformationRulesCondensed();
  const composition = buildCompositionLayeringCondensed();
  
  // Call generic foundation (DNA-driven, space-type neutral)
  const foundation = nicheImagePrompt(context, intent, decision, navigationFeatures);
  
  // Combine: Interior structure + interior-specific sections + foundation
  return `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

${header}

${interiorRules}

${perspective}

${parentAnalysis}

${transformRules}

${composition}

${foundation}`;
}
