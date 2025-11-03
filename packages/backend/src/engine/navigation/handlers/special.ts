/**
 * Special Movement Handlers
 * Handles GO_UP_DOWN, ENTER_PORTAL, APPROACH intents
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../types';

/**
 * Handle GO_UP_DOWN intent
 * User wants to go up/down stairs/elevator
 */
export function handleGoUpDown(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const direction = intent.direction || 'up';
  const targetName = intent.target ? ` via ${intent.target}` : '';
  
  // Create new niche at different elevation
  const parentId = currentNode.type === 'niche' 
    ? currentNode.parentId || currentNode.id
    : currentNode.id;
  
  return {
    action: 'create_niche',
    parentNodeId: parentId,
    newNodeType: 'niche',
    newNodeName: `${direction === 'up' ? 'Upper' : 'Lower'} level${targetName}`,
    metadata: {
      relation: currentNode.type === 'niche' ? 'sibling' : 'child',
      elevation: direction as 'up' | 'down'
    },
    reasoning: `Going ${direction}${targetName}`
  };
}

/**
 * Handle ENTER_PORTAL intent
 * User wants to enter painting/portal
 */
export function handleEnterPortal(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const portalName = intent.target || 'portal';
  
  return {
    action: 'teleport',
    parentNodeId: currentNode.id,
    newNodeType: 'location',
    newNodeName: `World beyond ${portalName}`,
    metadata: {
      relation: 'distant',
      portal: portalName
    },
    reasoning: `Entering ${portalName} (teleport to new location)`
  };
}

/**
 * Handle APPROACH intent
 * User wants to get closer to something
 */
export function handleApproach(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const targetName = intent.target || 'object';
  
  return {
    action: 'create_detail',
    parentNodeId: currentNode.id,
    newNodeType: 'detail',
    newNodeName: `Closer to ${targetName}`,
    metadata: {
      relation: 'child',
      viewType: 'approach'
    },
    reasoning: `Moving closer to ${targetName}`
  };
}
