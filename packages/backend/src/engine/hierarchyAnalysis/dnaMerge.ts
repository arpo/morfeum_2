/**
 * DNA Merge Utility
 * Merges parent and child DNA, with child overriding parent where specified
 * Based on frontend's locationCascading.ts logic
 * 
 * Enhanced with DNA inheritance enforcement to prevent "DNA dilution"
 * when creating nested spaces with contrasting concepts.
 */

import type { NodeDNA } from './types';

/**
 * Cascading fields that define world identity
 * These should be preserved across child nodes (80% preservation rule)
 */
const WORLD_IDENTITY_FIELDS: (keyof NodeDNA)[] = [
  'genre',
  'architectural_tone', 
  'cultural_tone',
  'palette_bias',
  'mood_baseline',
  'materials_base'
];

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
 * 
 * IMPORTANT: Uses nullish coalescing (??) for cascading fields to ensure
 * that null values properly inherit from parent instead of blocking inheritance.
 */
export function mergeDNA(parentDNA: NodeDNA, childDNA?: Partial<NodeDNA>): NodeDNA {
  if (!childDNA) {
    return parentDNA;
  }

  return {
    // Scene-specific visual fields (always present)
    // Uses || because empty strings should also fallback to parent
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
    
    // Cascading style attributes (WORLD IDENTITY FIELDS)
    // Uses ?? to ensure null values inherit from parent instead of blocking inheritance
    // This fixes the "DNA dilution" bug where genre: null blocked Post-Apocalyptic from propagating
    genre: childDNA.genre ?? parentDNA.genre,
    architectural_tone: childDNA.architectural_tone ?? parentDNA.architectural_tone,
    cultural_tone: childDNA.cultural_tone ?? parentDNA.cultural_tone,
    materials_base: childDNA.materials_base ?? parentDNA.materials_base,
    mood_baseline: childDNA.mood_baseline ?? parentDNA.mood_baseline,
    palette_bias: childDNA.palette_bias ?? parentDNA.palette_bias,
    soundscape_base: childDNA.soundscape_base ?? parentDNA.soundscape_base,
    flora_base: childDNA.flora_base ?? parentDNA.flora_base,
    fauna_base: childDNA.fauna_base ?? parentDNA.fauna_base
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

/**
 * Check if a node is a pass-through node (empty or minimal DNA)
 * Pass-through nodes should be skipped when resolving ancestry DNA
 * to ensure proper inheritance from meaningful ancestors.
 */
function isPassThroughNode(node: any): boolean {
  // Explicitly marked as pass-through
  if (node.isPassThrough === true) {
    return true;
  }
  
  // Empty DNA object
  if (!node.dna || Object.keys(node.dna).length === 0) {
    return true;
  }
  
  return false;
}

/**
 * Resolve ancestry DNA while SKIPPING pass-through nodes
 * This ensures that when parent is pass-through (empty DNA),
 * we get DNA from the nearest meaningful ancestor.
 * 
 * Example: whimsical house → pass-through location → Basement
 * The whimsical house should inherit from Basement, not from the empty pass-through.
 */
export function resolveAncestryDNASkippingPassThrough(
  nodeId: string,
  nodesMap: Record<string, any>,
  worldTrees: WorldTreeNode[]
): Partial<NodeDNA> | null {
  const ancestryIds = findAncestryChain(nodeId, worldTrees);

  if (ancestryIds.length === 0) {
    return null;
  }

  let resolvedDNA: Partial<NodeDNA> = {};

  // Merge DNA from each ancestor, SKIPPING pass-through nodes
  for (const ancestorId of ancestryIds) {
    const ancestor = nodesMap[ancestorId];
    
    // Skip pass-through nodes - they have no meaningful DNA
    if (isPassThroughNode(ancestor)) {
      continue;
    }
    
    if (ancestor?.dna) {
      resolvedDNA = mergeDNA(resolvedDNA as NodeDNA, ancestor.dna as Partial<NodeDNA>);
    }
  }

  return Object.keys(resolvedDNA).length > 0 ? resolvedDNA : null;
}

/**
 * Enforce DNA inheritance for world identity fields
 * Prevents "DNA dilution" when LLM generates completely different DNA
 * 
 * @param generatedDNA - DNA generated by LLM for new node
 * @param ancestryDNA - Resolved DNA from ancestors (non-pass-through)
 * @param breakInheritance - If true, skip enforcement (for --break flag)
 * @returns DNA with world identity fields enforced
 */
export function enforceDNAInheritance(
  generatedDNA: Partial<NodeDNA>,
  ancestryDNA: Partial<NodeDNA> | null,
  breakInheritance: boolean = false
): Partial<NodeDNA> {
  // If breaking inheritance or no ancestry, return as-is
  if (breakInheritance || !ancestryDNA) {
    return generatedDNA;
  }

  const enforced = { ...generatedDNA };

  // Enforce world identity fields
  for (const field of WORLD_IDENTITY_FIELDS) {
    const ancestryValue = ancestryDNA[field];
    const generatedValue = generatedDNA[field];
    
    if (!ancestryValue) {
      // No ancestry value, keep generated
      continue;
    }
    
    if (!generatedValue || generatedValue === null) {
      // LLM left it null/empty - inherit from ancestry
      (enforced as any)[field] = ancestryValue;
    } else if (generatedValue !== ancestryValue) {
      // LLM generated different value - blend them
      // Format: "ancestryValue with generatedValue elements"
      (enforced as any)[field] = `${ancestryValue} with ${generatedValue} elements`;
    }
    // If same value, keep as-is
  }

  return enforced;
}
