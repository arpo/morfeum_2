/**
 * Convenience Functions
 * 
 * Helper functions for creating single nodes.
 * Extracted from createHierarchy.ts for maintainability.
 */

import type { HostNode, RegionNode, LocationNode, NicheNode } from '../types';
import { createNode } from './createNode';

/**
 * Convenience function to create a single host
 */
export async function createHost(
  description: string,
  apiKey: string,
  options?: { createImage?: boolean; spawnId?: string }
): Promise<HostNode> {
  const result = await createNode('host', description, {
    apiKey,
    createImage: options?.createImage,
    spawnId: options?.spawnId,
  });
  return result.node as HostNode;
}

/**
 * Convenience function to create a region attached to a host
 */
export async function createRegion(
  description: string,
  parentHostId: string,
  apiKey: string,
  options?: { createImage?: boolean; spawnId?: string }
): Promise<RegionNode> {
  const result = await createNode('region', description, {
    apiKey,
    parentId: parentHostId,
    createImage: options?.createImage,
    spawnId: options?.spawnId,
  });
  return result.node as RegionNode;
}

/**
 * Convenience function to create a location attached to a region
 */
export async function createLocation(
  description: string,
  parentRegionId: string,
  apiKey: string,
  options?: { createImage?: boolean; spawnId?: string }
): Promise<LocationNode> {
  const result = await createNode('location', description, {
    apiKey,
    parentId: parentRegionId,
    createImage: options?.createImage,
    spawnId: options?.spawnId,
  });
  return result.node as LocationNode;
}

/**
 * Convenience function to create a niche attached to a location
 */
export async function createNiche(
  description: string,
  parentLocationId: string,
  apiKey: string,
  options?: { createImage?: boolean; spawnId?: string; perspective?: 'interior' | 'exterior' }
): Promise<NicheNode> {
  const result = await createNode('niche', description, {
    apiKey,
    parentId: parentLocationId,
    createImage: options?.createImage,
    spawnId: options?.spawnId,
    perspective: options?.perspective,
  });
  return result.node as NicheNode;
}
