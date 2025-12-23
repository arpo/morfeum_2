/**
 * Hierarchy Helper Utilities
 * 
 * Utility functions for hierarchy creation.
 * Extracted from createHierarchy.ts for maintainability.
 */

import { v4 as uuidv4 } from 'uuid';
import type { HierarchySpec, NodeType, RegionNode } from '../types';

/**
 * Determine the deepest node type from a hierarchy spec
 */
export function getDeepestNodeType(spec: HierarchySpec): NodeType {
  if (spec.niche) return 'niche';
  if (spec.location) return 'location';
  if (spec.region) return 'region';
  return 'host';
}

/**
 * Count how many nodes will be created
 */
export function countNodes(spec: HierarchySpec): number {
  let count = 0;
  if (spec.host) count++;
  if (spec.region) count++;
  if (spec.location) count++;
  if (spec.niche) count++;
  return count;
}

/**
 * Create a pass-through region node without LLM call.
 * Pass-through regions inherit all DNA from host.
 */
export function createPassThroughRegion(parentHostId?: string): RegionNode {
  return {
    id: uuidv4(),
    type: 'region',
    name: 'Region',
    description: '',
    isPassThrough: true,
    slug: 'region',
    // No DNA - inherits everything from host via cascade
    dna: {},
  };
}
