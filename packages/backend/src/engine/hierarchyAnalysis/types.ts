/**
 * Hierarchy Analysis Types
 * 
 * Defines the structure for analyzing user input and creating
 * a hierarchical node structure with 5 layers:
 * Host → Region → Location → Niche → Detail
 */

export type LayerType = 'host' | 'region' | 'location' | 'niche' | 'detail';

/**
 * Base interface for any node in the hierarchy
 */
export interface BaseHierarchyNode {
  name: string;
  description: string;
}

/**
 * Detail layer - Singular object or moment of attention
 * Example: "Glass on table", "Painting on wall"
 */
export interface DetailNode extends BaseHierarchyNode {
  type: 'detail';
}

/**
 * Niche layer - Micro-environment, interior or exterior focus zone
 * Example: "VIP room", "Rooftop terrace"
 */
export interface NicheNode extends BaseHierarchyNode {
  type: 'niche';
  details?: DetailNode[];
}

/**
 * Location layer - Specific place of activity or architecture
 * Example: "Techno club", "Botanical Dome"
 */
export interface LocationNode extends BaseHierarchyNode {
  type: 'location';
  niches?: NicheNode[];
}

/**
 * Region layer - Defines sub-culture or biome, local climate and mood
 * Example: "Ringön", "Financial District"
 */
export interface RegionNode extends BaseHierarchyNode {
  type: 'region';
  locations?: LocationNode[];
}

/**
 * Host layer - Governs tone, culture, light rhythm, social logic
 * Example: "Göteborg", "Metropolis"
 */
export interface HostNode extends BaseHierarchyNode {
  type: 'host';
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
}
