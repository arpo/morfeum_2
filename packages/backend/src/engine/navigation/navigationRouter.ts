/**
 * Navigation Router
 * Deterministic routing logic based on classified intent and context
 */

import type { IntentResult, NavigationContext, NavigationDecision, DestinationAnalysis } from './types';
import { handleGoInside, handleGoto, handleCreateCharacterReal, handleCreateCharacterUnreal } from './handlers';

/**
 * Options for routing that may include pre-computed analysis
 */
export interface RouteOptions {
  /** Pre-computed destination analysis for GOTO command */
  destinationAnalysis?: DestinationAnalysis;
}

/**
 * Route navigation based on intent and context
 * Uses deterministic logic - LLM calls happen before routing for commands that need them
 * 
 * Currently implemented commands:
 * - GO_INSIDE: Enter a location (creates interior niche)
 * - GOTO: Navigate to specific place (requires destinationAnalysis)
 * - CREATE_CHARACTER_REAL: Create realistic human character at current location
 * - CREATE_CHARACTER_UNREAL: Create fantastical humanoid character at current location
 */
export function routeNavigation(
  intent: IntentResult,
  context: NavigationContext,
  options?: RouteOptions
): NavigationDecision {
  
  switch (intent.intent) {
    case 'GO_INSIDE':
      return handleGoInside(intent, context);
    
    case 'GOTO':
      return handleGoto(intent, context, options?.destinationAnalysis);
    
    case 'CREATE_CHARACTER_REAL':
      return handleCreateCharacterReal(intent, context);
    
    case 'CREATE_CHARACTER_UNREAL':
      return handleCreateCharacterUnreal(intent, context);
    
    // Add new command cases here as they are implemented
    
    default:
      console.log(`[NavigationRouter] Command not implemented: ${intent.intent}`);
      return {
        action: 'not_implemented',
        reasoning: `Command "${intent.intent}" is not yet implemented`
      };
  }
}
