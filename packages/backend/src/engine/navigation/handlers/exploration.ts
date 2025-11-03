/**
 * Exploration Handlers
 * Handles EXPLORE_FEATURE and RELOCATE intents
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../types';
import { createRegionSpec, createLocationSpec, createNicheSpec } from '../navigationHelpers';

/**
 * Handle EXPLORE_FEATURE intent
 * User wants to follow/progress along a feature (river, corridor, etc.)
 */
export function handleExploreFeature(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const feature = intent.target || 'ahead';
  
  // Determine interior/exterior from current node type
  // Niches are typically interior, locations are typically exterior
  const isInterior = currentNode.type === 'niche';
  
  // Create sibling at same level showing progression
  if (!currentNode.parentId) {
    // If no parent, can't create sibling
    return {
      action: 'unknown',
      reasoning: `Cannot explore further - no parent node available`
    };
  }
  
  return {
    action: 'create_niche',
    parentNodeId: currentNode.parentId,
    newNodeType: currentNode.type,
    newNodeName: `Further along ${feature}`,
    metadata: {
      relation: 'sibling',
      progression: true,
      feature: feature,
      interior: isInterior
    },
    reasoning: `Exploring further along ${feature} (creating sibling ${currentNode.type})`
  };
}

/**
 * Handle RELOCATE intent
 * User wants to move to different place or district
 */
export function handleRelocate(intent: IntentResult, context: NavigationContext): NavigationDecision {
  const { currentNode } = context;
  const placeName = intent.target || 'new place';
  const isMacro = intent.relocationType === 'macro';
  
  if (isMacro && intent.newRegion) {
    // Macro relocation: Region → Location → Niche
    // Use placeholder IDs - actual IDs will be assigned during node creation
    const regionSpec = createRegionSpec('PENDING_HOST_ID', intent.newRegion);
    const locationSpec = createLocationSpec('PENDING_REGION_ID', placeName, 'commercial', false);
    const nicheSpec = createNicheSpec('PENDING_LOCATION_ID', `Inside ${placeName}`, true);
    
    return {
      action: 'create_hierarchy',
      nodeSpecs: [regionSpec, locationSpec, nicheSpec],
      metadata: {
        relocationType: 'macro',
        relation: 'distant'
      },
      reasoning: `Relocating to ${placeName} in ${intent.newRegion} (creating region → location → niche)`
    };
  } else {
    // Micro relocation: Location → Niche (same region)
    // Get current region ID
    const currentRegionId = currentNode.type === 'region' ? currentNode.id :
                            currentNode.parentId || 'PENDING_REGION_ID';
    
    const locationSpec = createLocationSpec(currentRegionId, placeName, 'retail', false);
    const nicheSpec = createNicheSpec('PENDING_LOCATION_ID', `Inside ${placeName}`, true);
    
    return {
      action: 'create_hierarchy',
      nodeSpecs: [locationSpec, nicheSpec],
      metadata: {
        relocationType: 'micro',
        relation: 'sibling'
      },
      reasoning: `Moving to ${placeName} nearby (creating location → niche in same region)`
    };
  }
}
