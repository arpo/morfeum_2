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
    
    // TODO: Implement these handlers
    // case 'GO_OUTSIDE':
    // case 'GO_TO_ROOM':
    // case 'GO_TO_PLACE':
    // case 'LOOK_AT':
    // case 'LOOK_THROUGH':
    // case 'CHANGE_VIEW':
    // case 'GO_UP_DOWN':
    // case 'ENTER_PORTAL':
    // case 'APPROACH':
    // case 'EXPLORE_FEATURE':
    // case 'RELOCATE':
    
    default:
      console.log(`[NavigationRouter] Command not implemented: ${intent.intent}`);
      return {
        action: 'not_implemented',
        reasoning: `Command "${intent.intent}" is not yet implemented`
      };
  }
}
