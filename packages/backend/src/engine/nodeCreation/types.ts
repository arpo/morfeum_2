/**
 * Node Creation System - Types
 * 
 * Shared types and interfaces for the node creation system.
 * This system creates world tree nodes (Host, Region, Location, Niche)
 * with DNA inheritance and optional image generation.
 */

import type { NodeDNA } from '../hierarchyAnalysis/types';

// =============================================================================
// NODE TYPES
// =============================================================================

/**
 * Valid node types in the hierarchy
 * Host → Region → Location → Niche
 */
export type NodeType = 'host' | 'region' | 'location' | 'niche';

/**
 * Scene perspective for image generation
 * - interior: Fully enclosed space (room, hall, cave)
 * - exterior: Open outdoor space (park, plaza, garden)
 * - open-air: Semi-enclosed with open sky (balcony, terrace, rooftop)
 */
export type ScenePerspective = 'interior' | 'exterior' | 'open-air';

/**
 * Camera style based on node type
 */
export type CameraStyle = 'establishing' | 'overview' | 'ground' | 'intimate' | 'aerial';

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

// =============================================================================
// DNA CONTEXT
// =============================================================================

/**
 * Parent context for DNA inheritance
 * Includes FULL parent node data for rich child generation
 */
export interface ParentDNAContext {
  // Parent identity
  name?: string;
  description?: string;
  type?: NodeType;
  
  // Full DNA fields (all 23+)
  looks?: string;
  colorsAndLighting?: string;
  atmosphere?: string;
  materials?: string;
  mood?: string;
  sounds?: string;
  spatialLayout?: string;
  primary_surfaces?: string;
  secondary_surfaces?: string;
  accent_features?: string;
  dominant?: string;
  secondary?: string;
  accent?: string;
  ambient?: string;
  
  // Cascading fields
  genre?: string;
  architectural_tone?: string;
  cultural_tone?: string;
  materials_base?: string;
  mood_baseline?: string;
  palette_bias?: string;
  soundscape_base?: string;
  flora_base?: string;
  fauna_base?: string;
  
  // Structure data
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
}

/**
 * Full parent context including node info
 */
export interface ParentContext {
  nodeId: string;
  nodeType: NodeType;
  nodeName: string;
  dna?: NodeDNA | Partial<NodeDNA>;
}

// =============================================================================
// SCENE DETECTION
// =============================================================================

/**
 * Result from scene type detection
 */
export interface SceneAnalysis {
  /** Interior, exterior, or transitional */
  sceneType: ScenePerspective;
  
  /** Detected hierarchy depth */
  suggestedDepth: NodeType;
  
  /** Camera style for image generation */
  cameraStyle: CameraStyle;
  
  /** Whether input contains explicit elements (e.g., \"with stairs and machine\") */
  hasExplicitElements: boolean;
  
  /** Confidence score 0-1 */
  confidence: number;
}

// =============================================================================
// PROGRESS
// =============================================================================

/**
 * Step definition for progress tracking
 */
export interface ProgressStep {
  id: string;
  name: string;
  nodeType?: NodeType;
}

/**
 * Progress configuration for dynamic step display
 */
export interface ProgressConfig {
  steps: ProgressStep[];
  includeImage: boolean;
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

/**
 * DNA prompt input for generating node DNA
 */
export interface DNAPromptInput {
  description: string;
  nodeType: NodeType;
  nodeName: string;
  parentContext?: ParentDNAContext;
}

/**
 * Image prompt input for generating node image
 */
export interface ImagePromptInput {
  node: Node;
  perspective: ScenePerspective;
  parentChain: Node[];
}
