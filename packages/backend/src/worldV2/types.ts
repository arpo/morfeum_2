/**
 * World V2 Types
 * 
 * Simplified DNA system for world creation.
 * Uses delta-only inheritance: children only store differences from parent.
 * 
 * Hierarchy: Host → Region → Node (infinite depth)
 * 
 * TODO: When V2 is stable, rename folder from worldV2/ to world/
 */

/**
 * Simplified DNA structure
 * 
 * All fields are arrays for consistent cascading behavior.
 * Children can have empty arrays to inherit from parent.
 */
export interface DNA {
  /** Core ideas/identity of the place (2 items) */
  essence: string[];
  
  /** Dominant forms and material families (2 items) */
  formsAndMaterials: string[];
  
  /** Palette tendency and light behavior (2 items) */
  colorAndLight: string[];
  
  /** Emotional tone and experiential quality (2 items) */
  atmosphere: string[];
  
  /** Genre drift prevention - visual motifs/styles to avoid (2 items) */
  banned: string[];
}

/**
 * Image prompt structure for location nodes
 * Only generated for nodes that will have images
 */
export interface PromptStructure {
  /** Wider context and horizon */
  background: string;
  
  /** Location identity (building, site, etc.) */
  midground: string;
  
  /** Approach/threshold element */
  foreground: string;
  
  /** Light behavior description */
  lighting: string;
  
  /** Atmospheric/sensory cues */
  atmosphere: string;
  
  /** Positive constraints (4-7 items) */
  constraints: string[];
  
  /** Negative constraints from banned list */
  negatives: string[];
}

/**
 * Host node - top-level world container
 */
export interface Host {
  id: string;
  type: 'host';
  name: string;
  slug: string;
  description: string;
  dna: DNA;
  
  /** Genre tag (e.g., 'steampunk', 'post-apocalyptic') - only on Host */
  genre?: string;
  
  /** Child regions */
  regions?: Region[];
}

/**
 * Region node - district/biome within a host
 */
export interface Region {
  id: string;
  type: 'region';
  name: string;
  slug: string;
  description: string;
  
  /** Delta-only DNA - empty arrays inherit from host */
  dna: DNA;
  
  /** Child nodes */
  nodes?: WorldNode[];
}

/**
 * Generic node - can represent location, niche, or any traversable space
 * Supports infinite depth via children
 */
export interface WorldNode {
  id: string;
  type: 'node';
  name: string;
  slug: string;
  description: string;
  
  /** Delta-only DNA - empty arrays inherit from parent */
  dna: DNA;
  
  /** Space type for image generation context */
  spaceType?: 'exterior' | 'interior';
  
  /** Image prompt structure (generated for display) */
  promptStructure?: PromptStructure;
  
  /** Image URL if generated */
  imageUrl?: string;
  
  /** Child nodes (infinite depth) */
  children?: WorldNode[];
}

/**
 * Complete world tree structure
 */
export interface WorldTree {
  host: Host;
}

/**
 * Cascaded DNA result after merging parent → child
 * Used for prompt generation and style lock compilation
 */
export interface CascadedDNA {
  host: DNA;
  region?: DNA;
  node?: DNA;
  
  /** Merged result with inheritance applied */
  effective: DNA;
}

/**
 * Request types for API endpoints
 */
export interface CreateHostRequest {
  concept: string;
  apiKey: string;
}

export interface CreateRegionRequest {
  concept: string;
  hostId: string;
  apiKey: string;
}

export interface CreateNodeRequest {
  concept: string;
  parentId: string;
  parentType: 'region' | 'node';
  apiKey: string;
}

/**
 * Response types for API endpoints
 */
export interface CreateHostResponse {
  host: Host;
}

export interface CreateRegionResponse {
  region: Region;
}

export interface CreateNodeResponse {
  node: WorldNode;
}
