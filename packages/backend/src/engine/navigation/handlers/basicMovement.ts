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
    const hasSpecificTarget = !!intent.target;
    
    return {
      action: 'create_niche',
      parentNodeId: currentNode.id,
      newNodeType: 'niche',
      newNodeName: `${intent.spaceType} of ${currentNode.name}`,
      style: intent.style || 'default',
      perspective: intent.spaceType || 'interior',
      metadata: {
        relation: 'child',
        entrance: entrance,
        hasSpecificTarget: hasSpecificTarget,
        targetObject: hasSpecificTarget ? entrance : undefined
      },
      reasoning: `Creating ${intent.spaceType} niche based on ${entrance} in ${currentNode.name}`
    };
  }
  
  // Inside a niche? Create child niche and promote parent to location
  if (currentNode.type === 'niche') {
    const entrance = intent.target || findEntrance(context);
    const hasSpecificTarget = !!intent.target;
    
    return {
      action: 'create_niche',
      parentNodeId: currentNode.id,
      newNodeType: 'niche',
      newNodeName: `${intent.spaceType || 'Interior'} of ${entrance}`,
      style: intent.style || 'default',
      perspective: intent.spaceType || 'interior',
      metadata: {
        relation: 'child',
        entrance: entrance,
        promoteParentToLocation: true,
        hasSpecificTarget: hasSpecificTarget,
        targetObject: hasSpecificTarget ? entrance : undefined
      },
      reasoning: `Creating child niche inside ${currentNode.name}, will promote parent to location`
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
