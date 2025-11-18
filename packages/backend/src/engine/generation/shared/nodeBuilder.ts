/**
 * Shared Node Builder Module
 * Standardized node construction for all location types
 */

import type { NodeDNA } from '../../hierarchyAnalysis/types';

export type LayerType = 'host' | 'region' | 'location' | 'niche' | 'feature' | 'detail';

export interface FocusConfig {
  node_id: string;
  perspective: string;
  viewpoint: string;
  distance: string;
}

export interface NodeBuildOptions {
  focus?: FocusConfig;
  parentId?: string;
  description?: string;
  data?: Record<string, any>;
  navigableElements?: any[];
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
}

export interface LocationNode {
  id: string;
  type: LayerType;
  name: string;
  dna: NodeDNA;
  imagePath: string;
  focus: FocusConfig;
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
 * Create default focus configuration
 */
function createDefaultFocus(nodeId: string, type: LayerType): FocusConfig {
  return {
    node_id: nodeId,
    perspective: type === 'niche' ? 'interior' : 'exterior',
    viewpoint: 'default view',
    distance: 'close'
  };
}

/**
 * Build a location node with standardized structure
 * 
 * @param type - Node type (host, region, location, niche)
 * @param name - Node name
 * @param dna - Node DNA object
 * @param imageUrl - Generated image URL
 * @param options - Optional configuration
 * @returns Complete node object
 */
export function buildNode(
  type: LayerType,
  name: string,
  dna: NodeDNA,
  imageUrl: string,
  options?: NodeBuildOptions
): LocationNode {
  const nodeId = generateNodeId(type);
  
  const node: LocationNode = {
    id: nodeId,
    type,
    name,
    dna,
    imagePath: imageUrl,
    focus: options?.focus || createDefaultFocus(nodeId, type)
  };

  // Add optional fields if provided
  if (options?.parentId) {
    node.parentId = options.parentId;
  }

  if (options?.description) {
    node.description = options.description;
  }

  if (options?.data) {
    node.data = options.data;
  }

  // Add structural fields if provided
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
