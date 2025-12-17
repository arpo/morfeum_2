/**
 * Shared Node Builder Module
 * SINGLE SOURCE OF TRUTH for node construction across the entire codebase.
 * Used by:
 * - WorldTreeBuilder (for building hierarchies from spawn data)
 * - createNodePipeline (for creating nodes during navigation)
 */

import type { NodeDNA } from '../../hierarchyAnalysis/types';
import type { Structure } from '../../navigation/types';

export type LayerType = 'host' | 'region' | 'location' | 'niche' | 'feature' | 'detail';

export type SpaceType = 'interior' | 'exterior' | 'open-air';

/** Furnishing details from --furnish flag */
export interface FurnishingDetails {
  userSpecified?: string[];
  suggested?: string[];
  placementNotes?: string[];
}

export interface NodeBuildOptions {
  /** Override auto-generated ID (used by WorldTreeBuilder for specific IDs) */
  id?: string;
  spaceType?: SpaceType;
  parentId?: string;
  description?: string;
  data?: Record<string, any>;
  /** Structure data stored separately from DNA */
  structure?: Structure;
  /** Furnishing details (when --furnish flag is used) */
  furnishingDetails?: FurnishingDetails;
  navigableElements?: any[];
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
  primaryMedia?: string;
  /** Pass-through region flag */
  isPassThrough?: boolean;
}

export interface LocationNode {
  id: string;
  type: LayerType;
  name: string;
  spaceType: SpaceType;
  dna: NodeDNA;
  /** Structure data stored separately from DNA */
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
  /** Pass-through region flag */
  isPassThrough?: boolean;
}

/**
 * Generate unique node ID with type prefix
 * Exported for use by WorldTreeBuilder and other modules
 */
export function generateNodeId(type: LayerType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${type}-${timestamp}-${random}`;
}

/**
 * Determine space type based on layer type and optional structure
 * NOTE: This is just a fallback. The pipeline should pass spaceType explicitly
 * based on structure analysis (roofType: 'open-sky' → 'exterior')
 */
function determineSpaceType(type: LayerType, structure?: Structure): SpaceType {
  // If structure indicates open-sky, it's exterior (not interior)
  if (structure?.roofType === 'open-sky') {
    return 'exterior';
  }
  // Default: niches are interior, others are exterior
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
  // Use provided ID or generate a new one
  const nodeId = options?.id || generateNodeId(type);
  
  const node: LocationNode = {
    id: nodeId,
    type,
    name,
    spaceType: options?.spaceType || determineSpaceType(type, options?.structure),
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

  // Add isPassThrough flag for pass-through regions
  if (options?.isPassThrough) {
    node.isPassThrough = true;
  }

  return node;
}
