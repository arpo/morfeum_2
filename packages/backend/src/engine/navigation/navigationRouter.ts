/**
 * Navigation Router
 * Deterministic routing logic based on classified intent and context
 */

import type { IntentResult, NavigationContext, NavigationDecision } from './types';

/**
 * Route navigation based on intent and context
 * Uses deterministic logic - no LLM calls
 */
export function routeNavigation(
  intent: IntentResult,
  context: NavigationContext
): NavigationDecision {
  
  const { currentNode } = context;
  
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
    
    default:
      return {
        action: 'unknown',
        reasoning: `Cannot handle intent: ${intent.intent}`
      };
  }
}

/**
 * Handle GO_INSIDE intent
 * User wants to enter/go inside current location
 */
function handleGoInside(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  
  // Must be at a location (exterior) to go inside
  if (currentNode.type === 'location') {
    // Find entrance from dominantElements
    const entrance = findEntrance(context);
    
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
function handleGoOutside(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
function handleGoToRoom(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
function handleGoToPlace(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
 * Handle LOOK_AT intent
 * User wants to examine something specific
 */
function handleLookAt(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
function handleLookThrough(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
function handleChangeView(intent: IntentResult, context: NavigationContext): NavigationDecision {
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

/**
 * Handle GO_UP_DOWN intent
 * User wants to go up/down stairs/elevator
 */
function handleGoUpDown(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
function handleEnterPortal(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
function handleApproach(intent: IntentResult, context: NavigationContext): NavigationDecision {
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
