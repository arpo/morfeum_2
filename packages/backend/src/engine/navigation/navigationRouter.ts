/**
 * Navigation Router
 * Deterministic routing logic based on classified intent and context
 */

import type { IntentResult, NavigationContext, NavigationDecision } from './types';
import {
  handleGoInside,
  handleGoOutside,
  handleGoToRoom,
  handleGoToPlace,
  handleLookAt,
  handleLookThrough,
  handleChangeView,
  handleGoUpDown,
  handleEnterPortal,
  handleApproach,
  handleExploreFeature,
  handleRelocate
} from './handlers';

/**
 * Route navigation based on intent and context
 * Uses deterministic logic - no LLM calls
 */
export function routeNavigation(
  intent: IntentResult,
  context: NavigationContext
): NavigationDecision {
  
  switch (intent.intent) {
    case 'GO_INSIDE':
      return handleGoInside(intent, context);
    
    case 'GO_OUTSIDE':
      return handleGoOutside(intent, context);
    
    case 'GO_TO_ROOM':
      return handleGoToRoom(intent, context);
    
    case 'GO_TO_PLACE':
      return handleGoToPlace(intent, context);
    
    case 'LOOK_AT':
      return handleLookAt(intent, context);
    
    case 'LOOK_THROUGH':
      return handleLookThrough(intent, context);
    
    case 'CHANGE_VIEW':
      return handleChangeView(intent, context);
    
    case 'GO_UP_DOWN':
      return handleGoUpDown(intent, context);
    
    case 'ENTER_PORTAL':
      return handleEnterPortal(intent, context);
    
    case 'APPROACH':
      return handleApproach(intent, context);
    
    case 'EXPLORE_FEATURE':
      return handleExploreFeature(intent, context);
    
    case 'RELOCATE':
      return handleRelocate(intent, context);
    
    default:
      return {
        action: 'unknown',
        reasoning: `Cannot handle intent: ${intent.intent}`
      };
  }
}
