/**
 * Navigation Router
 * Deterministic routing logic based on classified intent and context
 */

import type { IntentResult, NavigationContext, NavigationDecision } from './types';
import { handleGoInside } from './handlers';

/**
 * Route navigation based on intent and context
 * Uses deterministic logic - no LLM calls
 * 
 * Currently only GO_INSIDE is implemented.
 * Other commands will be added as development progresses.
 */
export function routeNavigation(
  intent: IntentResult,
  context: NavigationContext
): NavigationDecision {
  
  switch (intent.intent) {
    case 'GO_INSIDE':
      return handleGoInside(intent, context);
    
    // Add new command cases here as they are implemented
    
    default:
      console.log(`[NavigationRouter] Command not implemented: ${intent.intent}`);
      return {
        action: 'not_implemented',
        reasoning: `Command "${intent.intent}" is not yet implemented`
      };
  }
}
