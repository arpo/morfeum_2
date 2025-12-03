/**
 * Hierarchy Analysis Types
 * 
 * Defines the structure for analyzing user input and creating
 * a hierarchical node structure with 5 layers:
 * Host → Region → Location → Niche → Detail
 */

export type LayerType = 'host' | 'region' | 'location' | 'niche' | 'detail' | 'feature';

/**
 * Architectural Structure - Only for built/constructed spaces
 * Set to null for natural landscapes, outdoor areas, open environments
 */
export interface ArchitecturalStructure {
  form: string;           // round | rectangular | cylindrical | spherical | faceted | organic | arched | gothic | irregular
  roofType: string;       // domed | flat | vaulted | pitched | geodesic | arched | open-sky
  scale: string;          // small (<15m) | medium (15-50m) | large (>50m)
  orientation: string;    // vertical | horizontal | wide | cubic
  openings: string;       // large-glass | arched-windows | narrow-slits | open-passages | minimal | none
  functionalType: string; // residential | commercial | religious | industrial | civic | entertainment | natural
}

/**
 * Node DNA - Visual and atmospheric profile with cascading style attributes
 * 
 * Contains two types of fields:
 * 1. Scene-specific visual descriptions (always present in all nodes)
 * 2. Cascading style attributes (genre in host only, others can be sparse in children)
 */
export interface NodeDNA {
  // === SCENE-SPECIFIC VISUAL FIELDS (always present) ===
  
  // Core Visual Description
  looks: string;                    // 2-4 sentences describing what is seen
  colorsAndLighting: string;        // 1-3 sentences on colors and light
  atmosphere: string;               // 2-4 sentences on air, temperature, motion, weather
  materials: string;                // 1-3 sentences naming main materials
  mood: string;                     // 1-2 sentences on emotional tone
  sounds: string;                   // 5-7 words listing ambient sounds
  spatialLayout: string;            // 1-3 sentences on space shape, dimensions
  
  // Surface Materials
  primary_surfaces: string;         // Main materials on walls, floor, ceiling
  secondary_surfaces: string;       // Supporting materials on furniture
  accent_features: string;          // Decorative or striking details
  
  // Color Mapping
  dominant: string;                 // Primary color family with coverage area
  secondary: string;                // Secondary color and placement
  accent: string;                   // Accent colors and placement
  ambient: string;                  // Overall light tone (warm/cool/neutral)
  
  // === ARCHITECTURAL STRUCTURE (for interior generation) ===
  
  // Only for built/constructed spaces - null for natural landscapes, outdoor areas
  structure?: ArchitecturalStructure | null;
  
  // === CASCADING STYLE ATTRIBUTES (inheritable, can be sparse) ===
  
  // World Identity (ONLY in Host node, never in children)
  genre?: string;                   // e.g., 'post-apocalyptic', 'fantasy', 'sci-fi'
  
  // Inheritable Style Attributes (can be null in children if inherited from parent)
  architectural_tone?: string;      // Architectural style (e.g., 'industrial metallic')
  cultural_tone?: string;           // Social/functional identity
  materials_base?: string;          // Material palette/style
  mood_baseline?: string;           // Emotional baseline
  palette_bias?: string;            // Color style/families
  soundscape_base?: string;         // Ambient sound style
  flora_base?: string;              // Plant life types, or 'None'
  fauna_base?: string;              // Animal life types, or 'None'
}

/**
 * Base interface for any node in the hierarchy
 * 
 * Node structure separates:
 * - Root-level metadata (id, type, name, description)
 * - Structural/functional fields (navigableElements, slug, etc.)
 * - DNA (visual/atmospheric profile)
 */
export interface BaseHierarchyNode {
  name: string;
  description: string;
  dna?: NodeDNA | Partial<NodeDNA>;
  
  // Structural/Functional fields (NOT part of DNA)
  navigableElements?: Array<{
    type: string;        // door, passage, stairs, portal, window, etc.
    position: string;    // Location in scene
    description: string; // What it is
  }>;
  dominantElements?: string[];     // Positioned objects in scene
  uniqueIdentifiers?: string[];    // Distinctive visual features
  searchDesc?: string;             // Search metadata (75-100 chars)
  slug?: string;                   // URL-friendly identifier
  imageUrl?: string;               // Generated image URL
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
  classificationPrompt?: string;
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
