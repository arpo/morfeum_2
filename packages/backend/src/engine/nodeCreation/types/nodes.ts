/**
 * Node Types and Interfaces
 * 
 * Core node type definitions for the world tree hierarchy:
 * Host → Region → Location → Niche
 */

import type { NodeDNA } from '../../hierarchyAnalysis/types';

// =============================================================================
// NODE TYPES
// =============================================================================

/**
 * Valid node types in the hierarchy
 * Host → Region → Location → Niche
 */
export type NodeType = 'host' | 'region' | 'location' | 'niche';

// =============================================================================
// NAVIGABLE ELEMENTS
// =============================================================================

/**
 * Types of navigable elements that can be explored
 */
export type NavigableElementType = 
  | 'door' 
  | 'passage' 
  | 'stairs' 
  | 'archway' 
  | 'portal' 
  | 'window'
  | 'balcony'
  | 'bridge'
  | 'pier'
  | 'path'
  | 'gate'
  | 'tunnel'
  | 'elevator'
  | 'ladder';

/**
 * A navigable element within a node
 */
export interface NavigableElement {
  type: NavigableElementType | string;
  position: string;
  description: string;
}

// =============================================================================
// NODE STRUCTURE
// =============================================================================

/**
 * Base node interface (without children)
 */
export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  description: string;
  dna?: NodeDNA | Partial<NodeDNA>;
  
  // Structural fields
  navigableElements?: NavigableElement[];
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
  
  // Media
  primaryMedia?: string;
  imageUrl?: string;
}

/**
 * Host node - Top level of hierarchy
 */
export interface HostNode extends BaseNode {
  type: 'host';
  regions?: RegionNode[];
}

/**
 * Region node - District/biome within a host
 * 
 * Pass-through regions:
 * - Have `isPassThrough: true`
 * - Named simply "Region" with no description
 * - Pass DNA directly from host (all DNA fields null)
 * - Used when location is created without explicit region
 * - Only one pass-through region per host allowed
 */
export interface RegionNode extends BaseNode {
  type: 'region';
  /** 
   * Pass-through regions inherit all DNA from host without modification.
   * They exist to satisfy hierarchy requirements when no explicit region is defined.
   */
  isPassThrough?: boolean;
  locations?: LocationNode[];
}

/**
 * Location node - Building/site within a region
 */
export interface LocationNode extends BaseNode {
  type: 'location';
  niches?: NicheNode[];
}

/**
 * Niche node - Space within a location (interior or exterior)
 */
export interface NicheNode extends BaseNode {
  type: 'niche';
}

/**
 * Union type for any node
 */
export type Node = HostNode | RegionNode | LocationNode | NicheNode;
