/**
 * Node Creation Options and Results
 * 
 * Options for creating nodes/hierarchies and their result types.
 */


import { ParentDNAContext } from './context';
import type { Node, NodeType, HostNode } from './nodes';
import { ScenePerspective } from './scene';

// =============================================================================
// CREATE NODE OPTIONS
// =============================================================================

/**
 * Options for creating a single node
 */
export interface CreateNodeOptions {
  /** Parent node ID - required for region, location, niche */
  parentId?: string;
  
  /** Parent DNA context for inheritance */
  parentContext?: ParentDNAContext;
  
  /** Generate image for this node (default: false) */
  createImage?: boolean;
  
  /** Run as background task without visible progress */
  backgroundTask?: boolean;
  
  /** Visual style override */
  style?: string;
  
  /** Scene perspective override */
  perspective?: ScenePerspective;
  
  /** API key for LLM/image services */
  apiKey?: string;
  
  /** Spawn ID for progress tracking */
  spawnId?: string;
}

/**
 * Hierarchy specification for multi-node creation
 */
export interface HierarchySpec {
  /** Host description (world/setting) */
  host?: string;
  
  /** Region description (district/biome) */
  region?: string;
  
  /** Location description (building/site) */
  location?: string;
  
  /** Niche description (room/space) */
  niche?: string;
  
  /** 
   * If true, region is a pass-through (inherits all DNA from host).
   * Pass-through regions have no unique DNA and exist only to satisfy hierarchy.
   */
  regionIsPassThrough?: boolean;
}

/**
 * Options for creating a full hierarchy
 */
export interface CreateHierarchyOptions {
  /** Generate image on deepest node (default: true) */
  createImage?: boolean;
  
  /** Run as background task without visible progress */
  backgroundTask?: boolean;
  
  /** API key for LLM/image services */
  apiKey: string;
  
  /** Spawn ID for progress tracking */
  spawnId: string;
  
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Options for creating an image for an existing node
 */
export interface CreateImageOptions {
  /** API key for image services */
  apiKey: string;
  
  /** Spawn ID for progress tracking */
  spawnId?: string;
  
  /** Scene perspective override */
  perspective?: ScenePerspective;
}

// =============================================================================
// RESULT TYPES
// =============================================================================

/**
 * Result from creating a single node
 */
export interface CreateNodeResult {
  node: Node;
  imageUrl?: string;
  imagePrompt?: string;
}

/**
 * Result from creating a hierarchy
 */
export interface CreateHierarchyResult {
  /** Root node of the created tree */
  rootNode: HostNode;
  
  /** All created nodes in order */
  nodes: Node[];
  
  /** Image URL if generated */
  imageUrl?: string;
  
  /** Image prompt if generated */
  imagePrompt?: string;
  
  /** Depth of hierarchy created */
  depth: number;
}
