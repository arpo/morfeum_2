/**
 * Navigation Helpers
 * Stub functions for creating node specifications
 * TODO: Replace with LLM-generated descriptions in Phase 2
 */

import type { NodeSpec, NodeType, NavigationContext } from './types';

/**
 * Find parent location node from context
 * Traverses up from niche nodes to find the closest location parent
 * @param context - Navigation context
 * @returns Object with parentLocationId and parentLocationDNA
 */
export function findParentLocationNode(context: NavigationContext): {
  parentLocationId: string;
  parentLocationDNA: any;
} {
  const { currentNode, parentNode } = context;
  
  // If current node is a location, use it directly
  if (currentNode.type === 'location') {
    return {
      parentLocationId: currentNode.id,
      parentLocationDNA: currentNode.dna
    };
  }
  
  // If current node is a niche, traverse to parent location
  if (currentNode.type === 'niche' && parentNode) {
    // Parent should be a location
    if (parentNode.type === 'location') {
      return {
        parentLocationId: parentNode.id,
        parentLocationDNA: parentNode.dna
      };
    }
    
    // If parent is also a niche (shouldn't happen after our fix, but handle it)
    // Use the parent's parent ID and DNA if available
    if (parentNode.type === 'niche' && parentNode.dna) {
      return {
        parentLocationId: currentNode.parentId || currentNode.id,
        parentLocationDNA: parentNode.dna
      };
    }
  }
  
  // Fallback: use current node
  return {
    parentLocationId: currentNode.parentId || currentNode.id,
    parentLocationDNA: currentNode.dna
  };
}

/**
 * Create region specification (stub - will use LLM later)
 * @param hostId - Parent host ID
 * @param regionName - Name of the region
 * @returns NodeSpec for region
 */
export function createRegionSpec(
  hostId: string,
  regionName: string
): NodeSpec {
  return {
    type: 'region',
    name: regionName,
    parentId: hostId,
    metadata: {
      interior: false, // Regions are outdoor areas
      placeType: 'district'
    }
  };
}

/**
 * Create location specification (stub - will use LLM later)
 * @param parentId - Parent region ID
 * @param locationName - Name of the location
 * @param placeType - Type of place (bar, shop, cafe, etc.)
 * @param interior - Whether this is an interior location
 * @returns NodeSpec for location
 */
export function createLocationSpec(
  parentId: string,
  locationName: string,
  placeType: string,
  interior: boolean = false
): NodeSpec {
  return {
    type: 'location',
    name: locationName,
    parentId: parentId,
    metadata: {
      interior: interior,
      placeType: placeType
    }
  };
}

/**
 * Create niche specification (stub - will use LLM later)
 * @param parentId - Parent location ID
 * @param nicheName - Name of the niche
 * @param interior - Whether this is an interior space
 * @returns NodeSpec for niche
 */
export function createNicheSpec(
  parentId: string,
  nicheName: string,
  interior: boolean = true
): NodeSpec {
  return {
    type: 'niche',
    name: nicheName,
    parentId: parentId,
    metadata: {
      interior: interior,
      placeType: 'interior_space'
    }
  };
}
