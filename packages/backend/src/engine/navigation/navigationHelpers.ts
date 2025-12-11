/**
 * Navigation Helpers
 * Stub functions for creating node specifications
 * TODO: Replace with LLM-generated descriptions in Phase 2
 */

import type { NodeSpec, NodeType, NavigationContext } from './types';

/**
 * Find parent location node from context
 * Traverses up from niche nodes to find the closest location parent
 * 
 * IMPORTANT: This function should NEVER return a niche's DNA as parentDNA.
 * Only location-type nodes can be valid parents for DNA inheritance.
 * 
 * @param context - Navigation context
 * @returns Object with parentLocationId and parentLocationDNA (null if no valid parent found)
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
    // Parent should be a location - this is the expected case
    if (parentNode.type === 'location') {
      return {
        parentLocationId: parentNode.id,
        parentLocationDNA: parentNode.dna
      };
    }
    
    // If parent is also a niche, we can't use its DNA as parent DNA
    // Return null for DNA to indicate no valid parent location found
    if (parentNode.type === 'niche') {
      return {
        parentLocationId: currentNode.parentId || currentNode.id,
        parentLocationDNA: null // NEVER return niche DNA as parent DNA
      };
    }
  }
  
  // Fallback: return null for DNA - NEVER use current niche DNA as parent
  // The caller should use cascaded DNA functions instead
  return {
    parentLocationId: currentNode.parentId || currentNode.id,
    parentLocationDNA: null // Explicit null - caller must use cascaded DNA
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
