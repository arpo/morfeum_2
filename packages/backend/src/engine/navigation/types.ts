/**
 * Navigation System Types
 * Type definitions for the new LLM-based navigation system
 */

export type NodeType = 'host' | 'region' | 'location' | 'niche' | 'detail' | 'view';

/**
 * Navigation intents - only implemented commands
 * See NAVIGATION_INTENT_REGISTRY in pipelineConfig.ts for the source of truth
 */
export type NavigationIntent = 
  | 'GO_INSIDE'
  | 'GOTO'
  | 'UNKNOWN';

export interface IntentResult {
  intent: NavigationIntent;
  target: string | null;
  spaceType?: 'interior' | 'exterior' | 'unknown' | null;
  // Legacy props - kept for backward compatibility, rarely used
  direction?: string | null;
  newRegion?: string | null;
  relocationType?: 'macro' | 'micro' | null;
  style?: string | null;
  confidence?: number;
}

export interface NavigationContext {
  currentNode: {
    id: string;
    type: NodeType;
    name: string;
    parentId: string | null;
    data: {
      description?: string;
      looks?: string;
      dominantElements?: string[];
      spatialLayout?: string;
      uniqueIdentifiers?: string[];
      navigableElements?: Array<{
        type: string;
        position: string;
        description: string;
      }>;
      searchDesc?: string;
      materials_primary?: string;
      materials_secondary?: string;
      materials_accents?: string;
      colors_dominant?: string;
      colors_secondary?: string;
      colors_accents?: string;
      colors_ambient?: string;
      /** True for pass-through regions that inherit all DNA from host */
      isPassThrough?: boolean;
    };
    dna?: any;
  };
  parentNode?: {
    id: string;
    type: NodeType;
    name: string;
    data?: {
      description?: string;
      looks?: string;
    };
    dna?: {
      genre?: string;
      architectural_tone?: string;
      cultural_tone?: string;
      materials_base?: string;
      mood_baseline?: string;
      palette_bias?: string;
      flora_base?: string;
      fauna_base?: string;
    };
  };
  siblingNodes?: Array<{
    id: string;
    name: string;
    type: NodeType;
  }>;
  worldId?: string;
}

export type NavigationAction = 
  | 'move'
  | 'create_niche'
  | 'create_detail'
  | 'create_view'
  | 'create_hierarchy'
  | 'teleport'
  | 'not_implemented'
  | 'unknown';

export interface NodeSpec {
  type: NodeType;
  name: string;
  parentId: string;
  metadata: {
    interior?: boolean;
    placeType?: string;
    progression?: boolean;
    [key: string]: any;
  };
}

export interface NavigationDecision {
  action: NavigationAction;
  targetNodeId?: string;
  parentNodeId?: string;
  newNodeType?: NodeType;
  newNodeName?: string;
  nodeSpecs?: NodeSpec[];
  style?: string;        // NEW: Visual style to use for generation
  perspective?: string;  // NEW: Perspective (interior/exterior)
  metadata?: {
    relation?: 'child' | 'sibling' | 'parent' | 'distant';
    elevation?: 'up' | 'down';
    viewpoint?: string;
    entrance?: string;
    viewType?: 'approach' | 'detail' | 'through';
    portal?: string;
    interior?: boolean;
    progression?: boolean;
    relocationType?: 'macro' | 'micro';
    [key: string]: any;
  };
  reasoning: string;
}

export interface NavigationAnalysisResult {
  userCommand: string;
  context: NavigationContext;
  intent: IntentResult;
  decision: NavigationDecision;
}

/**
 * Result from LLM destination analysis for GOTO command
 * Synthesizes user's destination prompt with parent location context
 */
export interface DestinationAnalysis {
  /** Refined name for the destination niche */
  name: string;
  /** Whether this is an interior or exterior space */
  perspective: 'interior' | 'exterior';
  /** Type of space (room, outdoor, hallway, cellar, etc.) */
  spaceType: string;
  /** Whether the space is enclosed (affects image generation) */
  isEnclosed: boolean;
  /** Hint for atmosphere/mood to blend with parent DNA */
  atmosphereHint: string;
  /** Synthesized description combining user prompt with parent context */
  synthesizedDescription: string;
}

/**
 * Navigable Element - represents a door, passage, stairs, etc.
 * Used for navigation within spaces
 */
export interface NavigableElement {
  type: 'door' | 'passage' | 'corridor' | 'stairs' | 'ladder' | 'ramp' | 'platform' | 'walkway' | 'opening' | 'hatch' | 'archway' | 'window' | 'object';
  position: string;
  description: string;
}

/**
 * Structure - Physical/Spatial data for a node
 * Separate from DNA (which handles visual/atmospheric properties)
 * Structure is node-specific while DNA can cascade down the hierarchy
 */
export interface Structure {
  /** Architectural form of the space */
  form: 'rectangular' | 'round' | 'cylindrical' | 'spherical' | 'faceted' | 'organic' | 'arched' | 'gothic' | 'irregular';
  /** Type of roof/ceiling */
  roofType: 'domed' | 'flat' | 'vaulted' | 'pitched' | 'geodesic' | 'arched' | 'open-sky' | null;
  /** Scale of the space */
  scale: 'small' | 'medium' | 'large';
  /** Primary orientation */
  orientation: 'vertical' | 'horizontal' | 'wide' | 'cubic';
  /** Type of openings */
  openings: 'large-glass' | 'arched-windows' | 'narrow-slits' | 'open-passages' | 'minimal' | 'none';
  /** Shape of openings (windows/portholes) - must match parent exterior */
  openingShape?: 'rectangular' | 'circular' | 'arched' | 'mixed' | 'irregular';
  /** Functional purpose of the space */
  functionalType: 'residential' | 'commercial' | 'religious' | 'industrial' | 'civic' | 'entertainment';
  /** Spatial layout description */
  spatialLayout?: string;
  /** User-specified elements that must be included */
  requiredElements?: string[];
  /** Navigable elements (doors, passages, stairs, etc.) */
  navigableElements?: NavigableElement[];
  /** Dominant physical features */
  dominantElements?: string[];
  /** Unique identifying features */
  uniqueIdentifiers?: string[];
  /** Suggested fixtures based on functional type */
  suggestedFixtures?: string[];
}

/**
 * Result from LLM structure analysis
 * Determines physical/spatial properties of a new space
 */
export interface StructureAnalysis {
  /** Name for the space */
  name: string;
  /** Whether this is an interior or exterior space */
  perspective: 'interior' | 'exterior';
  /** Physical structure data */
  structure: Structure;
  /** Brief description of the space */
  description: string;
  /** Optional furnishing details for image prompt generation */
  furnishingDetails?: {
    userSpecified?: string[];
    suggested?: string[];
    placementNotes?: string[];
  };
}

/**
 * Combined result from parallel Space Analysis (Structure + DNA)
 */
export interface SpaceAnalysisResult {
  /** Structure analysis result */
  structureAnalysis: StructureAnalysis;
  /** DNA analysis result (visual/atmospheric) */
  dna: any;
  /** Synthesized image prompt */
  imagePrompt?: string;
}
