/**
 * GOTO Handler
 * Handles GOTO intent for navigating to specific places
 * - From niche: Creates sibling niche under parent location
 * - From location: Creates sibling location under parent region
 * Uses LLM analysis to synthesize user's destination with location context
 */

import type { IntentResult, NavigationContext, NavigationDecision, DestinationAnalysis } from '../types';
import { findParentLocationNode, findParentRegionNode } from '../navigationHelpers';

/**
 * Handle GOTO intent
 * User wants to navigate to a specific place
 * 
 * Context-aware behavior:
 * - From niche: Navigate within location (creates sibling niche)
 * - From location: Navigate within region (creates sibling location)
 * 
 * @param intent - The intent result with target being the user's destination prompt
 * @param context - Navigation context with current node
 * @param destinationAnalysis - Optional pre-computed destination analysis from LLM
 */
export function handleGoto(
  intent: IntentResult,
  context: NavigationContext,
  destinationAnalysis?: DestinationAnalysis
): NavigationDecision {
  const { currentNode } = context;
  
  // Handle GOTO from location (creates sibling location under parent region)
  if (currentNode.type === 'location') {
    // Must have a destination
    if (!intent.target) {
      return {
        action: 'unknown',
        reasoning: 'GOTO requires a destination. Usage: /GOTO <destination description>'
      };
    }
    
    // Find parent region for sibling location creation
    const { parentRegionId } = findParentRegionNode(context);
    
    // If we have destination analysis from LLM, use it
    if (destinationAnalysis) {
      return {
        action: 'create_location',
        parentNodeId: parentRegionId,
        newNodeType: 'location',
        newNodeName: destinationAnalysis.name,
        style: 'default',
        perspective: 'exterior',  // Locations are always exterior
        metadata: {
          relation: 'sibling',
          destinationAnalysis,
          userPrompt: intent.target
        },
        reasoning: `Navigating to ${destinationAnalysis.name} (exterior location) - ${destinationAnalysis.atmosphereHint || 'new location in region'}`
      };
    }
    
    // Fallback if no analysis
    return {
      action: 'create_location',
      parentNodeId: parentRegionId,
      newNodeType: 'location',
      newNodeName: intent.target,
      style: 'default',
      perspective: 'exterior',
      metadata: {
        relation: 'sibling',
        userPrompt: intent.target
      },
      reasoning: `Creating location for destination: ${intent.target}`
    };
  }
  
  // Handle GOTO from niche (existing behavior - creates sibling niche)
  if (currentNode.type !== 'niche') {
    return {
      action: 'not_implemented',
      reasoning: `GOTO from ${currentNode.type} is not yet implemented. Works from niche or location nodes.`
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
