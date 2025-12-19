/**
 * Navigation Helpers
 * Shared utility functions for navigation operations
 * 
 * DNA RESOLUTION NOTE:
 * The findParent*Node functions return IDs and basic DNA from context.
 * For PROPER cascaded DNA resolution, use resolveNavigationParentDNA() which:
 * 1. Loads worldsData from storage
 * 2. Handles pass-through regions (uses host DNA)
 * 3. Uses getResolvedNodeDNA for cascaded inheritance
 */

import type { NodeSpec, NodeType, NavigationContext, CommandContext } from './types';
import { getResolvedNodeDNA } from '../hierarchyAnalysis/dnaMerge';

// ═══════════════════════════════════════════════════════════════════════════
// TREE TRAVERSAL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * World tree node structure for traversal
 */
interface WorldTreeNode {
  id: string;
  type: string;
  children?: WorldTreeNode[];
}

/**
 * Find the host node for a given region ID by traversing worldTrees
 * Used for pass-through regions to get DNA from the host
 * 
 * @param regionId - The region node ID to find the host for
 * @param worldTrees - Array of world tree structures
 * @param nodes - Map of all nodes by ID
 * @returns The host node with DNA, or null if not found
 */
export function findHostForRegion(
  regionId: string, 
  worldTrees: WorldTreeNode[], 
  nodes: Record<string, any>
): any | null {
  for (const tree of worldTrees) {
    // Check if this tree's host has the region as a child
    if (tree.children) {
      for (const child of tree.children) {
        if (child.id === regionId) {
          // Found the region, return the host node
          return nodes[tree.id];
        }
      }
    }
  }
  return null;
}

/**
 * Add a child entry to a world tree under a specific parent
 * Traverses recursively to find the target parent node
 * 
 * @param tree - The world tree array to modify
 * @param targetId - The parent node ID to add the child under
 * @param childEntry - The child entry to add { id, type, children: [] }
 * @returns true if child was added, false if parent not found
 */
export function addChildToWorldTree(
  tree: WorldTreeNode[], 
  targetId: string, 
  childEntry: WorldTreeNode
): boolean {
  for (const node of tree) {
    if (node.id === targetId) {
      if (!node.children) node.children = [];
      node.children.push(childEntry);
      return true;
    }
    if (node.children && addChildToWorldTree(node.children, targetId, childEntry)) {
      return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARENT NODE RESOLUTION (from context)
// ═══════════════════════════════════════════════════════════════════════════

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
 * Find parent region node from context
 * Used when creating sibling locations from GOTO command
 * 
 * @param context - Navigation context (current node should be a location)
 * @returns Object with parentRegionId and parentRegionDNA
 */
export function findParentRegionNode(context: NavigationContext): {
  parentRegionId: string;
  parentRegionDNA: any;
} {
  const { currentNode, parentNode } = context;
  
  // If current node is a location, find its parent region
  if (currentNode.type === 'location') {
    // Use parentNode if available
    if (parentNode && parentNode.type === 'region') {
      return {
        parentRegionId: parentNode.id,
        parentRegionDNA: parentNode.dna
      };
    }
    
    // Fallback to parentId from current node
    if (currentNode.parentId) {
      return {
        parentRegionId: currentNode.parentId,
        parentRegionDNA: parentNode?.dna || null
      };
    }
  }
  
  // Fallback: use currentNode's parentId or id
  return {
    parentRegionId: currentNode.parentId || currentNode.id,
    parentRegionDNA: null
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

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED DNA RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * World data structure for DNA resolution
 */
interface WorldsData {
  nodes: Record<string, any>;
  worldTrees: WorldTreeNode[];
}

/**
 * Result from DNA resolution
 */
export interface DNAResolutionResult {
  /** Parent node ID for tree attachment */
  parentNodeId: string;
  /** Fully resolved/cascaded parent DNA */
  resolvedParentDNA: any | null;
  /** Type of node being created */
  targetNodeType: 'location' | 'niche';
}

/**
 * Resolve parent DNA for navigation commands (GOTO and GO_INSIDE)
 * Consolidates DNA resolution logic into a single source of truth
 * 
 * Handles:
 * - GOTO from location → sibling location under parent region (uses region/host DNA)
 * - GOTO from niche → sibling niche under parent location (uses cascaded location DNA)
 * - GO_INSIDE from location → child niche under current location
 * - GO_INSIDE from niche → child niche under current niche (infinite depth)
 * 
 * @param command - The navigation command ('GOTO' or 'GO_INSIDE')
 * @param context - Navigation context with current/parent node info
 * @param worldsData - World data with nodes and trees for DNA lookup
 * @returns DNAResolutionResult with parentNodeId, resolvedParentDNA, and targetNodeType
 */
export function resolveNavigationParentDNA(
  command: 'GOTO' | 'GO_INSIDE',
  context: NavigationContext,
  worldsData: WorldsData
): DNAResolutionResult {
  const currentNodeType = context.currentNode.type;
  
  // GO_INSIDE: Creates child niche under CURRENT node (location or niche)
  // This enables infinite niche depth - niches can contain niches
  if (command === 'GO_INSIDE') {
    const currentNodeId = context.currentNode.id;
    
    // Use cascaded DNA resolution for full ancestry inheritance
    // This works for any depth - resolves DNA from host → region → location → niche → ...
    const resolvedParentDNA = getResolvedNodeDNA(
      currentNodeId,
      worldsData.nodes,
      worldsData.worldTrees
    );
    
    return {
      parentNodeId: currentNodeId,  // Use current node as parent (not parent location)
      resolvedParentDNA,
      targetNodeType: 'niche'
    };
  }
  
  // GOTO: Context-aware - creates sibling at same level
  if (currentNodeType === 'location') {
    // GOTO from location: create sibling location under parent region
    const { parentRegionId } = findParentRegionNode(context);
    const parentRegionNode = worldsData.nodes[parentRegionId];
    
    let resolvedParentDNA: any = null;
    
    if (parentRegionNode) {
      // Check if region is pass-through (use host DNA instead)
      const isPassThrough = parentRegionNode.isPassThrough || 
        (parentRegionNode.type === 'region' && (!parentRegionNode.dna || Object.keys(parentRegionNode.dna).length === 0));
      
      if (isPassThrough) {
        // Find host and use its DNA
        const hostNode = findHostForRegion(parentRegionId, worldsData.worldTrees, worldsData.nodes);
        if (hostNode?.dna) {
          resolvedParentDNA = hostNode.dna;
        }
      } else if (parentRegionNode.dna) {
        resolvedParentDNA = parentRegionNode.dna;
      }
    }
    
    return {
      parentNodeId: parentRegionId,
      resolvedParentDNA,
      targetNodeType: 'location'
    };
  }
  
  // GOTO from niche: create sibling niche under parent location
  const { parentLocationId } = findParentLocationNode(context);
  
  // Use cascaded DNA resolution for full ancestry inheritance (Host → Region → Location)
  const resolvedParentDNA = getResolvedNodeDNA(
    parentLocationId,
    worldsData.nodes,
    worldsData.worldTrees
  );
  
  return {
    parentNodeId: parentLocationId,
    resolvedParentDNA,
    targetNodeType: 'niche'
  };
}

/**
 * Determine if destination analysis should run for a command
 * GOTO always needs it, GO_INSIDE never needs it
 * 
 * @param command - The navigation command
 * @param userPrompt - User's destination description
 * @returns true if destination analysis should run
 */
export function shouldRunDestinationAnalysis(
  command: 'GOTO' | 'GO_INSIDE',
  userPrompt: string
): boolean {
  // GOTO always benefits from destination analysis
  if (command === 'GOTO') {
    return true;
  }
  
  // GO_INSIDE: Never run destination analysis
  // The command itself defines the intent (create interior space)
  return false;
}
