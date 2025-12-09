/**
 * DNA Inheritance
 * 
 * Handles parent → child DNA cascade for node creation.
 * Extracts inheritable style attributes from parent nodes.
 */

import type { NodeDNA } from '../../hierarchyAnalysis/types';
import type { ParentDNAContext, Node, NodeType } from '../types';

/**
 * Extract DNA context from a parent node for inheritance
 * 
 * @param parentDNA - Parent node's DNA
 * @param parentNode - Optional parent node for name/description/structure
 * @returns Context object with ALL inheritable fields
 */
export function extractParentDNAContext(
  parentDNA?: NodeDNA | Partial<NodeDNA>,
  parentNode?: { name?: string; description?: string; type?: NodeType; dominantElements?: string[]; uniqueIdentifiers?: string[]; searchDesc?: string }
): ParentDNAContext {
  if (!parentDNA && !parentNode) {
    return {};
  }

  return {
    // Parent identity
    name: parentNode?.name,
    description: parentNode?.description,
    type: parentNode?.type,
    
    // Full DNA fields (all 23+)
    looks: parentDNA?.looks,
    colorsAndLighting: parentDNA?.colorsAndLighting,
    atmosphere: parentDNA?.atmosphere,
    materials: parentDNA?.materials,
    mood: parentDNA?.mood,
    sounds: parentDNA?.sounds,
    spatialLayout: parentDNA?.spatialLayout,
    primary_surfaces: parentDNA?.primary_surfaces,
    secondary_surfaces: parentDNA?.secondary_surfaces,
    accent_features: parentDNA?.accent_features,
    dominant: parentDNA?.dominant,
    secondary: parentDNA?.secondary,
    accent: parentDNA?.accent,
    ambient: parentDNA?.ambient,
    
    // Cascading fields
    genre: parentDNA?.genre,
    architectural_tone: parentDNA?.architectural_tone,
    cultural_tone: parentDNA?.cultural_tone,
    materials_base: parentDNA?.materials_base,
    mood_baseline: parentDNA?.mood_baseline,
    palette_bias: parentDNA?.palette_bias,
    soundscape_base: parentDNA?.soundscape_base,
    flora_base: parentDNA?.flora_base,
    fauna_base: parentDNA?.fauna_base,
    
    // Structure data
    dominantElements: parentNode?.dominantElements,
    uniqueIdentifiers: parentNode?.uniqueIdentifiers,
    searchDesc: parentNode?.searchDesc,
  };
}

/**
 * Build full parent context from a node
 * 
 * @param node - Parent node
 * @returns Full parent context including node info
 */
export function buildParentContext(node: Node): {
  nodeId: string;
  nodeType: NodeType;
  nodeName: string;
  dna?: NodeDNA | Partial<NodeDNA>;
  dnaContext: ParentDNAContext;
} {
  return {
    nodeId: node.id,
    nodeType: node.type,
    nodeName: node.name,
    dna: node.dna,
    dnaContext: extractParentDNAContext(node.dna),
  };
}

/**
 * Merge child DNA with parent DNA, respecting inheritance
 * 
 * Child DNA fields that are null/undefined inherit from parent.
 * Child DNA fields that are set override parent.
 * 
 * @param childDNA - Child node's DNA (may have null fields)
 * @param parentDNA - Parent node's DNA
 * @returns Merged DNA with inherited values filled in
 */
export function mergeDNAWithInheritance(
  childDNA: Partial<NodeDNA>,
  parentDNA?: NodeDNA | Partial<NodeDNA>
): Partial<NodeDNA> {
  if (!parentDNA) {
    return childDNA;
  }

  // Cascading fields that can be inherited
  const cascadingFields: (keyof NodeDNA)[] = [
    'architectural_tone',
    'cultural_tone',
    'materials_base',
    'mood_baseline',
    'palette_bias',
    'soundscape_base',
    'flora_base',
    'fauna_base',
  ];

  const merged = { ...childDNA };

  for (const field of cascadingFields) {
    // If child has null/undefined, inherit from parent
    if (merged[field] === null || merged[field] === undefined) {
      if (parentDNA[field] !== undefined) {
        (merged as any)[field] = parentDNA[field];
      }
    }
  }

  // Genre is NEVER inherited to children - only host has it
  // So we don't include it in cascading fields

  return merged;
}

/**
 * Get the expected parent type for a given node type
 * 
 * @param nodeType - The node type to check
 * @returns Expected parent type, or null for host
 */
export function getExpectedParentType(nodeType: NodeType): NodeType | null {
  switch (nodeType) {
    case 'host':
      return null; // Host has no parent
    case 'region':
      return 'host';
    case 'location':
      return 'region';
    case 'niche':
      return 'location';
    default:
      return null;
  }
}

/**
 * Get the expected child type for a given node type
 * 
 * @param nodeType - The node type to check
 * @returns Expected child type, or null for niche
 */
export function getExpectedChildType(nodeType: NodeType): NodeType | null {
  switch (nodeType) {
    case 'host':
      return 'region';
    case 'region':
      return 'location';
    case 'location':
      return 'niche';
    case 'niche':
      return null; // Niche has no children (deepest level)
    default:
      return null;
  }
}

/**
 * Get the depth level for a node type (0 = host, 3 = niche)
 * 
 * @param nodeType - The node type
 * @returns Depth level
 */
export function getNodeDepth(nodeType: NodeType): number {
  switch (nodeType) {
    case 'host':
      return 0;
    case 'region':
      return 1;
    case 'location':
      return 2;
    case 'niche':
      return 3;
    default:
      return 0;
  }
}
