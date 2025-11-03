/**
 * Viewing Handlers
 * Handles LOOK_AT, LOOK_THROUGH, CHANGE_VIEW intents
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../types';

/**
 * Handle LOOK_AT intent
 * User wants to examine something specific
 */
export function handleLookAt(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const targetName = intent.target || 'object';
  
  return {
    action: 'create_detail',
    parentNodeId: currentNode.id,
    newNodeType: 'detail',
    newNodeName: `Detail: ${targetName}`,
    metadata: {
      relation: 'child',
      viewType: 'detail'
    },
    reasoning: `Examining ${targetName} in detail`
  };
}

/**
 * Handle LOOK_THROUGH intent
 * User wants to look through window/opening
 */
export function handleLookThrough(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const targetName = intent.target || 'window';
  const direction = intent.direction || 'through';
  
  return {
    action: 'create_detail',
    parentNodeId: currentNode.id,
    newNodeType: 'detail',
    newNodeName: `View ${direction} ${targetName}`,
    metadata: {
      relation: 'child',
      viewType: 'through'
    },
    reasoning: `Looking ${direction} ${targetName}`
  };
}

/**
 * Handle CHANGE_VIEW intent
 * User wants to change perspective
 */
export function handleChangeView(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const direction = intent.direction || 'around';
  
  return {
    action: 'create_view',
    parentNodeId: currentNode.id,
    newNodeType: 'view',
    newNodeName: `View: ${direction}`,
    metadata: {
      relation: 'child',
      viewpoint: direction
    },
    reasoning: `Changing perspective to look ${direction}`
  };
}
