/**
 * Navigation Helpers
 * Stub functions for creating node specifications
 * TODO: Replace with LLM-generated descriptions in Phase 2
 */

import type { NodeSpec, NodeType } from './types';

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
