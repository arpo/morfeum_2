/**
 * Style Registry
 * Central registry mapping navigation intents to available visual styles
 */

import type { NavigationIntent, IntentResult, NavigationContext, NavigationDecision } from '../../../../navigation/types';
import { nicheImagePrompt } from '../nicheImagePrompt';
import { interiorAdaptation } from './go-inside/interior';
import { exteriorAdaptation } from './go-inside/exterior';

/**
 * Style prompt function signature
 * All style prompts must follow this interface
 */
export type StylePromptFunction = (
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
) => string;

/**
 * Style definition
 */
export interface StyleDefinition {
  name: string;
  description: string;  // Used by intent classifier to understand when to apply
  prompt: StylePromptFunction;
}

/**
 * Style Registry
 * Maps each navigation intent to its available styles
 * 
 * Currently only GO_INSIDE has styles defined.
 * Other intents can be added as needed.
 */
export const STYLE_REGISTRY: Record<string, Record<string, StyleDefinition>> = {
  GO_INSIDE: {
    default: {
      name: 'interior',
      description: 'Enclosed interior spaces - DNA-driven style within structural interior rules',
      prompt: interiorAdaptation  // Interior adaptation wraps foundation
    },
    exterior: {
      name: 'exterior',
      description: 'Open-air outdoor niches within location - sky visible above, natural lighting, no enclosed ceiling',
      prompt: exteriorAdaptation  // Exterior adaptation wraps foundation
    }
    // Future DNA-driven style variations can layer on top of any adaptation
  }
  // Future intents can be added here
  // GO_OUTSIDE: { ... }
  // ENTER_PORTAL: { ... }
};

/**
 * Get available styles for a given intent
 */
export function getAvailableStyles(intent: NavigationIntent): StyleDefinition[] {
  const styles = STYLE_REGISTRY[intent];
  if (!styles) return [];
  return Object.values(styles);
}

/**
 * Get style prompt function for an intent and style name
 * Falls back to default if style not found
 */
export function getStylePrompt(
  intent: NavigationIntent,
  styleName: string = 'default'
): StylePromptFunction {
  const styles = STYLE_REGISTRY[intent];
  
  // No styles for this intent - return default GO_INSIDE prompt as fallback
  if (!styles) {
    return STYLE_REGISTRY.GO_INSIDE.default.prompt;
  }
  
  // Return requested style or default
  return styles[styleName]?.prompt || styles.default?.prompt || STYLE_REGISTRY.GO_INSIDE.default.prompt;
}

/**
 * Check if an intent has style support
 */
export function hasStyleSupport(intent: NavigationIntent): boolean {
  return !!STYLE_REGISTRY[intent] && Object.keys(STYLE_REGISTRY[intent]).length > 0;
}
