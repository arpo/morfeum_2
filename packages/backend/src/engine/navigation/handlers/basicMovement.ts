/**
 * Basic Movement Handlers
 * Handles GO_INSIDE intent
 * 
 * Add new movement handlers here as they are implemented.
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../types';
import { findParentLocationNode } from '../navigationHelpers';

/**
 * Handle GO_INSIDE intent
 * User wants to enter/go inside current location
 */
export function handleGoInside(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  
  // Must be at a location (exterior) to go inside
  if (currentNode.type === 'location') {
    // Prioritize intent.target from smart selection, fall back to findEntrance helper
    const entrance = intent.target || findEntrance(context);
    
    return {
      action: 'create_niche',
      parentNodeId: currentNode.id,
      newNodeType: 'niche',
      newNodeName: `${intent.spaceType} of ${currentNode.name}`,
      style: intent.style || 'default',
      perspective: intent.spaceType || 'interior',
      metadata: {
        relation: 'child',
        entrance: entrance
      },
      reasoning: `Creating ${intent.spaceType} niche based on ${entrance} in ${currentNode.name}`
    };
  }
  
  // Already inside a niche? Create sibling niche under parent location
  if (currentNode.type === 'niche' && intent.target) {
    const { parentLocationId } = findParentLocationNode(context);
    
    return {
      action: 'create_niche',
      parentNodeId: parentLocationId,
      newNodeType: 'niche',
      newNodeName: `${intent.spaceType || 'Interior'} of ${intent.target}`,
      style: intent.style || 'default',
      perspective: intent.spaceType || 'interior',
      metadata: {
        relation: 'sibling'
      },
      reasoning: `Creating sibling niche under parent location for ${intent.target}`
    };
  }
  
  return {
    action: 'unknown',
    reasoning: `Cannot go inside from ${currentNode.type}`
  };
}

/**
 * Helper: Find entrance target combining dominantElements[0] + navigableElements[0]
 * Returns: "{main structure} via {entrance description} {entrance position}"
 */
function findEntrance(context: NavigationContext): string {
  const elements = context.currentNode.data.dominantElements || [];
  const navigable = context.currentNode.data.navigableElements || [];
  
  // Get the main target (what you're entering)
  const target = elements[0] || context.currentNode.name;
  
  // Combine with navigable element if available (how you're entering)
  if (navigable[0]) {
    const entrance = navigable[0];
    const entranceDesc = entrance.description || entrance.type;
    const position = entrance.position ? ` ${entrance.position}` : '';
    return `${target} via ${entranceDesc}${position}`;
  }
  
  return target;
}
