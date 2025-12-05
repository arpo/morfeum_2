/**
 * GOTO Handler
 * Handles GOTO intent for navigating to specific places within a location
 * Uses LLM analysis to synthesize user's destination with location context
 */

import type { IntentResult, NavigationContext, NavigationDecision, DestinationAnalysis } from '../types';
import { findParentLocationNode } from '../navigationHelpers';

/**
 * Handle GOTO intent
 * User wants to navigate to a specific place within the current location
 * 
 * @param intent - The intent result with target being the user's destination prompt
 * @param context - Navigation context with current niche and parent location
 * @param destinationAnalysis - Optional pre-computed destination analysis from LLM
 */
export function handleGoto(
  intent: IntentResult,
  context: NavigationContext,
  destinationAnalysis?: DestinationAnalysis
): NavigationDecision {
  const { currentNode } = context;
  
  // GOTO currently only works from niche nodes
  if (currentNode.type !== 'niche') {
    return {
      action: 'not_implemented',
      reasoning: `GOTO from ${currentNode.type} is not yet implemented. Currently only works from niche nodes.`
    };
  }
  
  // Must have a destination
  if (!intent.target) {
    return {
      action: 'unknown',
      reasoning: 'GOTO requires a destination. Usage: /GOTO <destination description>'
    };
  }
  
  // Find parent location for sibling niche creation
  const { parentLocationId } = findParentLocationNode(context);
  
  // If we have destination analysis from LLM, use it
  if (destinationAnalysis) {
    return {
      action: 'create_niche',
      parentNodeId: parentLocationId,
      newNodeType: 'niche',
      newNodeName: destinationAnalysis.name,
      style: 'default',
      perspective: destinationAnalysis.perspective,
      metadata: {
        relation: 'sibling',
        destinationAnalysis,
        userPrompt: intent.target
      },
      reasoning: `Navigating to ${destinationAnalysis.name} (${destinationAnalysis.perspective}) - ${destinationAnalysis.atmosphereHint}`
    };
  }
  
  // Fallback if no analysis (should not happen in normal flow)
  return {
    action: 'create_niche',
    parentNodeId: parentLocationId,
    newNodeType: 'niche',
    newNodeName: intent.target,
    style: 'default',
    perspective: 'interior', // Default to interior
    metadata: {
      relation: 'sibling',
      userPrompt: intent.target
    },
    reasoning: `Creating niche for destination: ${intent.target}`
  };
}
