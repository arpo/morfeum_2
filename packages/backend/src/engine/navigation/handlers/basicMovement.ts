/**
 * Basic Movement Handlers
 * Handles GO_INSIDE, GO_OUTSIDE, GO_TO_ROOM, GO_TO_PLACE intents
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../types';

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
      newNodeName: `Interior of ${currentNode.name}`,
      metadata: {
        relation: 'child',
        entrance: entrance
      },
      reasoning: `Creating interior niche based on ${entrance} in ${currentNode.name}`
    };
  }
  
  // Already inside? Create deeper niche
  if (currentNode.type === 'niche' && intent.target) {
    return {
      action: 'create_niche',
      parentNodeId: currentNode.id,
      newNodeType: 'niche',
      newNodeName: `Inside ${intent.target}`,
      metadata: {
        relation: 'child'
      },
      reasoning: `Going deeper inside ${intent.target}`
    };
  }
  
  return {
    action: 'unknown',
    reasoning: `Cannot go inside from ${currentNode.type}`
  };
}

/**
 * Handle GO_OUTSIDE intent
 * User wants to exit/leave current location
 */
export function handleGoOutside(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode, parentNode } = context;
  
  // Must be at a niche (interior) to go outside
  if (currentNode.type === 'niche' && parentNode) {
    return {
      action: 'move',
      targetNodeId: parentNode.id,
      metadata: {
        relation: 'parent'
      },
      reasoning: `Exiting to ${parentNode.name}`
    };
  }
  
  return {
    action: 'unknown',
    reasoning: `Cannot go outside from ${currentNode.type} (no parent found)`
  };
}

/**
 * Handle GO_TO_ROOM intent
 * User wants to go to specific room/space (sibling niche)
 */
export function handleGoToRoom(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const roomName = intent.target || 'New Room';
  
  // At a niche? Create sibling niche
  if (currentNode.type === 'niche' && currentNode.parentId) {
    return {
      action: 'create_niche',
      parentNodeId: currentNode.parentId,
      newNodeType: 'niche',
      newNodeName: roomName,
      metadata: {
        relation: 'sibling'
      },
      reasoning: `Going to ${roomName} (sibling niche under same parent)`
    };
  }
  
  // At a location? Create child niche
  if (currentNode.type === 'location') {
    return {
      action: 'create_niche',
      parentNodeId: currentNode.id,
      newNodeType: 'niche',
      newNodeName: roomName,
      metadata: {
        relation: 'child'
      },
      reasoning: `Going to ${roomName} inside ${currentNode.name}`
    };
  }
  
  return {
    action: 'unknown',
    reasoning: `Cannot navigate to room from ${currentNode.type}`
  };
}

/**
 * Handle GO_TO_PLACE intent
 * User wants to go to a location/structure
 */
export function handleGoToPlace(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const placeName = intent.target || 'New Location';
  
  // Create new location as sibling or under parent
  const parentId = currentNode.type === 'location' 
    ? currentNode.parentId || currentNode.id
    : currentNode.id;
  
  return {
    action: 'create_niche',
    parentNodeId: parentId,
    newNodeType: 'location',
    newNodeName: placeName,
    metadata: {
      relation: 'sibling'
    },
    reasoning: `Going to ${placeName} (new location)`
  };
}

/**
 * Helper: Find entrance from dominantElements
 */
function findEntrance(context: NavigationContext): string {
  const elements = context.currentNode.data.dominantElements || [];
  
  // Look for entrance-like elements
  const entranceWords = ['door', 'entrance', 'gate', 'archway', 'portal', 'doorway'];
  const entrance = elements.find(el => 
    entranceWords.some(word => el.toLowerCase().includes(word))
  );
  
  return entrance || elements[0] || context.currentNode.name;
}
