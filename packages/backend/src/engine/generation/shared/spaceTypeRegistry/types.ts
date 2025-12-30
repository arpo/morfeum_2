/**
 * Space Type Registry - Type Definitions
 */

/**
 * Container types - what kind of enclosure/space the user is entering
 */
export type ContainerType = 
  | 'building'      // Standard architectural structures (rooms, halls, houses, caves)
  | 'vehicle-car'   // Automotive vehicles (cars, trucks, vans, buses)
  | 'vehicle-boat'  // Watercraft (ships, boats, yachts, submarines)
  | 'natural'       // Natural formations (clearings, groves)
  | 'tent-like';    // Temporary/fabric structures (tents, pavilions, canopies)

/**
 * Perspective types - the viewing angle/relationship to the space
 */
export type SpacePerspective = 'interior' | 'exterior' | 'open-air';

/**
 * Complete space type definition with rules and prompts
 */
export interface SpaceTypeDefinition {
  /** Unique identifier for this space type */
  id: string;
  
  /** Container category */
  containerType: ContainerType;
  
  /** Base perspective */
  perspective: SpacePerspective;
  
  /** Human-readable description */
  description: string;
  
  // === Physical Properties ===
  
  /** Whether the space has a roof/ceiling */
  hasRoof: boolean;
  
  /** Wall coverage */
  hasWalls: 'full' | 'partial' | 'none';
  
  // === Prompts for LLM ===
  
  /** Guidance for DNA generation (what to focus on) */
  dnaGuidance: string;
  
  /** Guidance for structure analysis */
  structureGuidance: string;
  
  /** Direct constraints added to image prompt */
  imageConstraints: string[];
  
  /** Materials typical for this space type */
  typicalMaterials: string[];
  
  /** Elements that should NOT appear */
  excludeElements: string[];
}

/**
 * All container types as array (for TypeScript)
 */
export const ALL_CONTAINER_TYPES: ContainerType[] = [
  'building',
  'vehicle-car', 
  'vehicle-boat',
  'natural',
  'tent-like'
];
