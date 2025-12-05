/**
 * DNA Merge Utility
 * Merges parent and child DNA, with child overriding parent where specified
 * Based on frontend's locationCascading.ts logic
 */

import type { NodeDNA } from './types';

/**
 * WorldTree node structure for traversal
 */
interface WorldTreeNode {
  id: string;
  type: string;
  children?: WorldTreeNode[];
}

/**
 * Node with DNA for ancestry resolution
 */
interface NodeWithDNA {
  id: string;
  type: string;
  name?: string;
  dna?: NodeDNA | Partial<NodeDNA>;
}

/**
 * Merge parent DNA with child DNA (sparse overrides)
 * Returns a complete DNA object where child values override parent values
 * Null/undefined child values inherit from parent
 */
export function mergeDNA(parentDNA: NodeDNA, childDNA?: Partial<NodeDNA>): NodeDNA {
  if (!childDNA) {
    return parentDNA;
  }

  return {
    // Scene-specific visual fields (always present)
    looks: childDNA.looks || parentDNA.looks,
    colorsAndLighting: childDNA.colorsAndLighting || parentDNA.colorsAndLighting,
    atmosphere: childDNA.atmosphere || parentDNA.atmosphere,
    materials: childDNA.materials || parentDNA.materials,
    mood: childDNA.mood || parentDNA.mood,
    sounds: childDNA.sounds || parentDNA.sounds,
    spatialLayout: childDNA.spatialLayout || parentDNA.spatialLayout,
    primary_surfaces: childDNA.primary_surfaces || parentDNA.primary_surfaces,
    secondary_surfaces: childDNA.secondary_surfaces || parentDNA.secondary_surfaces,
    accent_features: childDNA.accent_features || parentDNA.accent_features,
    dominant: childDNA.dominant || parentDNA.dominant,
    secondary: childDNA.secondary || parentDNA.secondary,
    accent: childDNA.accent || parentDNA.accent,
    ambient: childDNA.ambient || parentDNA.ambient,
    
    // Cascading style attributes (can be sparse/null in children)
    genre: childDNA.genre !== undefined ? childDNA.genre : parentDNA.genre,
    architectural_tone: childDNA.architectural_tone !== undefined ? childDNA.architectural_tone : parentDNA.architectural_tone,
    cultural_tone: childDNA.cultural_tone !== undefined ? childDNA.cultural_tone : parentDNA.cultural_tone,
    materials_base: childDNA.materials_base !== undefined ? childDNA.materials_base : parentDNA.materials_base,
    mood_baseline: childDNA.mood_baseline !== undefined ? childDNA.mood_baseline : parentDNA.mood_baseline,
    palette_bias: childDNA.palette_bias !== undefined ? childDNA.palette_bias : parentDNA.palette_bias,
    soundscape_base: childDNA.soundscape_base !== undefined ? childDNA.soundscape_base : parentDNA.soundscape_base,
    flora_base: childDNA.flora_base !== undefined ? childDNA.flora_base : parentDNA.flora_base,
    fauna_base: childDNA.fauna_base !== undefined ? childDNA.fauna_base : parentDNA.fauna_base
  };
}

/**
 * Convert complete NodeDNA to JSON string for LLM context
 * Formats in a clean, readable way for the LLM to reference
 */
export function formatDNAForContext(dna: NodeDNA): string {
  return JSON.stringify(dna, null, 2);
}

/**
 * Find the ancestry chain for a node by traversing worldTrees
 * Returns array from host (root) to immediate parent, NOT including the node itself
 *
 * @param nodeId - ID of the node to find ancestors for
 * @param worldTrees - Array of world tree structures
 * @returns Array of ancestor node IDs from root (host) to immediate parent
 */
export function findAncestryChain(
  nodeId: string,
  worldTrees: WorldTreeNode[]
): string[] {
  // Recursive search through tree
  function searchTree(
    tree: WorldTreeNode,
    targetId: string,
    currentPath: string[]
  ): string[] | null {
    // If this node is the target, return the path (not including target)
    if (tree.id === targetId) {
      return currentPath;
    }

    // Search children
    if (tree.children) {
      for (const child of tree.children) {
        const result = searchTree(child, targetId, [...currentPath, tree.id]);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  // Search through all world trees
  for (const tree of worldTrees) {
    const result = searchTree(tree, nodeId, []);
    if (result) {
      return result;
    }
  }

  return [];
}

/**
 * Resolve full ancestry DNA by walking up the tree
 * Merges DNA from host → region → location, filling null values from ancestors
 *
 * This is the core function for the cascading DNA system.
 * It ensures that when a field is null in a child, it inherits from ancestors.
 *
 * @param nodeId - ID of the node whose parent DNA we want to resolve
 * @param nodesMap - Map of all nodes by ID
 * @param worldTrees - Array of world tree structures
 * @returns Fully-resolved DNA with nulls filled from ancestors, or null if not found
 */
export function resolveAncestryDNA(
  nodeId: string,
  nodesMap: Record<string, NodeWithDNA>,
  worldTrees: WorldTreeNode[]
): Partial<NodeDNA> | null {
  // Find the ancestry chain (host → region → ... → immediate parent)
  const ancestryIds = findAncestryChain(nodeId, worldTrees);

  if (ancestryIds.length === 0) {
    // Node is a root or not found
    return null;
  }

  // Start with empty DNA
  let resolvedDNA: Partial<NodeDNA> = {};

  // Merge DNA from each ancestor (host first, then down to immediate parent)
  // This ensures deeper nodes override higher ones, but nulls inherit from above
  for (const ancestorId of ancestryIds) {
    const ancestor = nodesMap[ancestorId];
    if (ancestor?.dna) {
      resolvedDNA = mergeDNA(resolvedDNA as NodeDNA, ancestor.dna as Partial<NodeDNA>);
    }
  }

  return resolvedDNA;
}

/**
 * Get fully resolved DNA for a node, including its own DNA merged with ancestry
 *
 * @param nodeId - ID of the node
 * @param nodesMap - Map of all nodes by ID
 * @param worldTrees - Array of world tree structures
 * @returns Node's DNA with all nulls resolved from ancestry
 */
export function getResolvedNodeDNA(
  nodeId: string,
  nodesMap: Record<string, NodeWithDNA>,
  worldTrees: WorldTreeNode[]
): Partial<NodeDNA> | null {
  const node = nodesMap[nodeId];
  if (!node) {
    return null;
  }

  // Get ancestry DNA
  const ancestryDNA = resolveAncestryDNA(nodeId, nodesMap, worldTrees);

  if (!ancestryDNA) {
    // No ancestors, return node's own DNA
    return node.dna || null;
  }

  if (!node.dna) {
    // Node has no DNA, return ancestry
    return ancestryDNA;
  }

  // Merge node's DNA with ancestry (node overrides ancestry)
  return mergeDNA(ancestryDNA as NodeDNA, node.dna as Partial<NodeDNA>);
}
