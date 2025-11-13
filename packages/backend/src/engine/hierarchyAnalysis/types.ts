/**
 * Hierarchy Analysis Types
 * 
 * Defines the structure for analyzing user input and creating
 * a hierarchical node structure with 5 layers:
 * Host → Region → Location → Niche → Detail
 */

export type LayerType = 'host' | 'region' | 'location' | 'niche' | 'detail' | 'feature';

/**
 * Node DNA - Simplified, flat visual and atmospheric profile
 * Generated per-node to capture essential qualities without hierarchical complexity
 */
export interface NodeDNA {
  // Visual Description (4 fields)
  looks: string;                    // 2-4 sentences describing what is seen
  colorsAndLighting: string;        // 1-3 sentences on colors and light
  atmosphere: string;               // 2-4 sentences on air, temperature, motion, weather
  architectural_tone: string;       // 10-20 char phrase (e.g. 'futuristic metal')
  
  // Cultural & Material (3 fields)
  cultural_tone: string;            // 1 sentence on social/functional identity
  materials: string;                // 1-3 sentences naming main materials
  mood: string;                     // 1-2 sentences on emotional tone
  
  // Sensory & Elements (3 fields)
  sounds: string;                   // 5-7 words listing ambient sounds
  dominantElementsDescriptors: string; // 3-5 defining objects or structures
  spatialLayout: string;            // 1-3 sentences on space shape, dimensions
  
  // Surface Materials (3 fields)
  primary_surfaces: string;         // Main materials on walls, floor, ceiling
  secondary_surfaces: string;       // Supporting materials on furniture
  accent_features: string;          // Decorative or striking details
  
  // Color Mapping (4 fields)
  dominant: string;                 // Primary color family with coverage area
  secondary: string;                // Secondary color and placement
  accent: string;                   // Accent colors and placement
  ambient: string;                  // Overall light tone (warm/cool/neutral)
  
  // Identity (2 fields)
  uniqueIdentifiers: string;        // 2-4 distinctive visual features
  searchDesc: string;               // 75-100 char search description
}

/**
 * Base interface for any node in the hierarchy
 */
export interface BaseHierarchyNode {
  name: string;
  description: string;
  dna?: NodeDNA | Partial<NodeDNA>;
}

/**
 * Detail layer - Singular object or moment of attention
 * Example: "Glass on table", "Painting on wall"
 */
export interface DetailNode extends BaseHierarchyNode {
  type: 'detail';
  dna?: NodeDNA;
}

/**
 * Niche layer - Micro-environment, interior or exterior focus zone
 * Example: "VIP room", "Rooftop terrace"
 */
export interface NicheNode extends BaseHierarchyNode {
  type: 'niche';
  dna?: NodeDNA;
  details?: DetailNode[];
}

/**
 * Location layer - Specific place of activity or architecture
 * Example: "Techno club", "Botanical Dome"
 */
export interface LocationNode extends BaseHierarchyNode {
  type: 'location';
  dna?: NodeDNA;
  niches?: NicheNode[];
}

/**
 * Region layer - Defines sub-culture or biome, local climate and mood
 * Example: "Ringön", "Financial District"
 */
export interface RegionNode extends BaseHierarchyNode {
  type: 'region';
  dna?: NodeDNA;
  locations?: LocationNode[];
}

/**
 * Host layer - Governs tone, culture, light rhythm, social logic
 * Example: "Göteborg", "Metropolis"
 */
export interface HostNode extends BaseHierarchyNode {
  type: 'host';
  dna?: NodeDNA;
  regions?: RegionNode[];
}

/**
 * Union type for any hierarchy node
 */
export type HierarchyNode = HostNode | RegionNode | LocationNode | NicheNode | DetailNode;

/**
 * The complete hierarchy structure returned by the analyzer
 */
export interface HierarchyStructure {
  host: HostNode;
}

/**
 * Metadata about the analyzed hierarchy
 */
export interface HierarchyMetadata {
  layersDetected: LayerType[];
  totalNodes: number;
  hasMultipleRegions: boolean;
  hasMultipleLocations: boolean;
}

/**
 * Complete response from hierarchy analysis
 */
export interface HierarchyAnalysisResult {
  hierarchy: HierarchyStructure;
  metadata: HierarchyMetadata;
  imageUrl?: string;
}

/**
 * Parent context for DNA generation
 * Contains key attributes from parent node to ensure visual consistency
 */
export interface ParentContext {
  architectural_tone?: string;
  cultural_tone?: string;
  dominant?: string;
  mood?: string;
}
