/**
 * Shared Node Builder Module
 * Standardized node construction for all location types
 */

import type { NodeDNA } from '../../hierarchyAnalysis/types';
import type { Structure } from '../../navigation/types';

export type LayerType = 'host' | 'region' | 'location' | 'niche' | 'feature' | 'detail';

export type SpaceType = 'interior' | 'exterior';

/** Furnishing details from --furnish flag */
export interface FurnishingDetails {
  userSpecified?: string[];
  suggested?: string[];
  placementNotes?: string[];
}

export interface NodeBuildOptions {
  spaceType?: SpaceType;
  parentId?: string;
  description?: string;
  data?: Record<string, any>;
  /** NEW: Structure data stored separately from DNA */
  structure?: Structure;
  /** Furnishing details (when --furnish flag is used) */
  furnishingDetails?: FurnishingDetails;
  navigableElements?: any[];
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
  primaryMedia?: string;
}

export interface LocationNode {
  id: string;
  type: LayerType;
  name: string;
  spaceType: SpaceType;
  dna: NodeDNA;
  /** NEW: Structure data stored separately from DNA */
  structure?: Structure;
  /** Furnishing details (when --furnish flag is used) */
  furnishingDetails?: FurnishingDetails;
  primaryMedia?: string;
  parentId?: string;
  description?: string;
  data?: Record<string, any>;
  navigableElements?: any[];
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
}

/**
 * Generate unique node ID
 */
function generateNodeId(type: LayerType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${type}-${timestamp}-${random}`;
}

/**
 * Determine space type based on layer type
 */
function determineSpaceType(type: LayerType): SpaceType {
  return type === 'niche' ? 'interior' : 'exterior';
}

/**
 * Build a location node with standardized structure
 * 
 * @param type - Node type (host, region, location, niche)
 * @param name - Node name
 * @param dna - Node DNA object
 * @param options - Optional configuration
 * @returns Complete node object
 */
export function buildNode(
  type: LayerType,
  name: string,
  dna: NodeDNA,
  options?: NodeBuildOptions
): LocationNode {
  const nodeId = generateNodeId(type);
  
  const node: LocationNode = {
    id: nodeId,
    type,
    name,
    spaceType: options?.spaceType || determineSpaceType(type),
    dna,
  };

  // Add optional fields if provided
  if (options?.primaryMedia) {
    node.primaryMedia = options.primaryMedia;
  }

  if (options?.parentId) {
    node.parentId = options.parentId;
  }

  if (options?.description) {
    node.description = options.description;
  }

  if (options?.data) {
    node.data = options.data;
  }

  // NEW: Add structure data (separate from DNA)
  if (options?.structure) {
    node.structure = options.structure;
  }

  // Add furnishing details (when --furnish flag is used)
  if (options?.furnishingDetails) {
    node.furnishingDetails = options.furnishingDetails;
  }

  // Add structural fields if provided (legacy, also in structure)
  if (options?.navigableElements) {
    node.navigableElements = options.navigableElements;
  }

  if (options?.dominantElements) {
    node.dominantElements = options.dominantElements;
  }

  if (options?.uniqueIdentifiers) {
    node.uniqueIdentifiers = options.uniqueIdentifiers;
  }

  if (options?.searchDesc) {
    node.searchDesc = options.searchDesc;
  }

  if (options?.slug) {
    node.slug = options.slug;
  }

  return node;
}
