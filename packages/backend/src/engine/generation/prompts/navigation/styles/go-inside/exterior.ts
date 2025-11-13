/**
 * Exterior Adaptation
 * Wraps generic nicheImagePrompt with exterior-specific structural rules
 * DNA descriptors still drive the visual style
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../../../../../navigation/types';
import { nicheImagePrompt } from '../../nicheImagePrompt';
import {
  extractEntranceElement,
  buildParentStructureAnalysisExterior,
  buildTransformationRulesCondensedExterior,
  buildCompositionLayeringCondensedExterior,
} from '../../../shared/promptSections';

/**
 * Exterior adaptation - adds structural rules for open-air spaces
 * Wraps the generic foundation
 */
export function exteriorAdaptation(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  const entranceElement = extractEntranceElement(decision.reasoning);
  
  // Build exterior-specific structural sections
  const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OPEN AIR SPACE: ${entranceElement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  const exteriorRules = `EXTERIOR SPACE RULES:
- Open-air niche within parent location
- Sky visible above (no ceiling/roof overhead)
- Natural lighting (daylight/ambient/atmospheric)
- Weather elements appropriate to location (if any)
- Match scale and form of "${entranceElement}"
- Exterior surfaces and materials
- Ground-level or elevated platform perspective`;
  
  const perspective = `PERSPECTIVE: Standing within the open-air space, looking across it. Wide-angle (24-35mm), eye-level or slight upward tilt. Sky visible in upper frame. Balanced composition showing the niche's extent.

CRITICAL - ENTRANCE EXCLUSION:
The entrance/gateway/threshold is BEHIND the camera and OUT OF FRAME.
DO NOT describe, mention, or include the entrance in your output.
Your description starts WITHIN the exterior space, looking at its features.`;
  
  // Use exterior-specific prompt sections
  const parentAnalysis = buildParentStructureAnalysisExterior(entranceElement, context.currentNode.data.looks);
  const transformRules = buildTransformationRulesCondensedExterior();
  const composition = buildCompositionLayeringCondensedExterior();
  
  // Call generic foundation (DNA-driven, space-type neutral)
  const foundation = nicheImagePrompt(context, intent, decision, navigationFeatures);
  
  // Combine: Exterior structure + exterior-specific sections + foundation
  return `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

${header}

${exteriorRules}

${perspective}

${parentAnalysis}

${transformRules}

${composition}

${foundation}`;
}
