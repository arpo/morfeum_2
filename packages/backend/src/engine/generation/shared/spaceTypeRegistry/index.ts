/**
 * Space Type Registry
 * 
 * Central registry defining rules, prompts, and constraints for each space/container type.
 * The LLM determines the containerType during structure analysis - this registry
 * provides the rules and guidance for that type.
 * 
 * Adding a new container type:
 * 1. Add the type to ContainerType union in types.ts
 * 2. Create a new file in the appropriate category folder (building/, vehicle/, natural/, tentLike/)
 * 3. Import and add to SPACE_TYPE_REGISTRY below
 * 4. The LLM prompt in structureAnalysis.ts auto-updates via getContainerTypeDescriptions()
 */

// Re-export types
export type { ContainerType, SpacePerspective, SpaceTypeDefinition } from './types';
export { ALL_CONTAINER_TYPES } from './types';

// Import type definitions
import type { ContainerType, SpacePerspective, SpaceTypeDefinition } from './types';

// Import individual space types
import { BUILDING_INTERIOR } from './building/interior';
import { BUILDING_EXTERIOR } from './building/exterior';
import { BUILDING_OPEN_AIR } from './building/openAir';
import { VEHICLE_CAR_CABIN } from './vehicle/carCabin';
import { VEHICLE_BOAT_CABIN } from './vehicle/boatCabin';
import { VEHICLE_BOAT_DECK } from './vehicle/boatDeck';
import { NATURAL_CLEARING } from './natural/clearing';
import { TENT_INTERIOR } from './tentLike/interior';

/**
 * Central registry of all space types
 */
export const SPACE_TYPE_REGISTRY: Record<string, SpaceTypeDefinition> = {
  // Building types
  'building-interior': BUILDING_INTERIOR,
  'building-exterior': BUILDING_EXTERIOR,
  'building-open-air': BUILDING_OPEN_AIR,
  // Vehicle types
  'vehicle-car-cabin': VEHICLE_CAR_CABIN,
  'vehicle-boat-cabin': VEHICLE_BOAT_CABIN,
  'vehicle-boat-deck': VEHICLE_BOAT_DECK,
  // Natural types
  'natural-clearing': NATURAL_CLEARING,
  // Tent-like types
  'tent-interior': TENT_INTERIOR
};

/**
 * Get space type definition by container type and perspective
 */
export function getSpaceTypeDefinition(
  containerType: ContainerType,
  perspective: SpacePerspective
): SpaceTypeDefinition | undefined {
  // Build the lookup key based on container type and perspective
  let key: string;
  
  switch (containerType) {
    case 'building':
      key = `building-${perspective}`;
      break;
    case 'vehicle-car':
      key = 'vehicle-car-cabin'; // Cars only have cabin (interior)
      break;
    case 'vehicle-boat':
      key = perspective === 'open-air' ? 'vehicle-boat-deck' : 'vehicle-boat-cabin';
      break;
    case 'natural':
      key = 'natural-clearing';
      break;
    case 'tent-like':
      key = 'tent-interior';
      break;
    default:
      // Fallback to building type
      key = `building-${perspective}`;
  }
  
  return SPACE_TYPE_REGISTRY[key];
}

/**
 * Get DNA guidance for a container type and perspective
 */
export function getDNAGuidance(
  containerType: ContainerType,
  perspective: SpacePerspective
): string {
  const definition = getSpaceTypeDefinition(containerType, perspective);
  return definition?.dnaGuidance || SPACE_TYPE_REGISTRY['building-interior'].dnaGuidance;
}

/**
 * Get structure guidance for a container type and perspective
 */
export function getStructureGuidance(
  containerType: ContainerType,
  perspective: SpacePerspective
): string {
  const definition = getSpaceTypeDefinition(containerType, perspective);
  return definition?.structureGuidance || SPACE_TYPE_REGISTRY['building-interior'].structureGuidance;
}

/**
 * Get image constraints for a container type and perspective
 */
export function getImageConstraints(
  containerType: ContainerType,
  perspective: SpacePerspective
): string[] {
  const definition = getSpaceTypeDefinition(containerType, perspective);
  return definition?.imageConstraints || [];
}

/**
 * Get all container types for LLM prompt (used in structureAnalysis)
 */
export function getContainerTypeDescriptions(): string {
  return `
- building: Standard architectural structures (rooms, halls, houses, caves, any man-made building)
- vehicle-car: Automotive vehicles (cars, trucks, vans, buses, motorcycles with sidecar)
- vehicle-boat: Watercraft (ships, boats, yachts, submarines, any vessel on/in water)
- natural: Natural outdoor formations (forest clearings, groves, meadows, beaches - no structures)
- tent-like: Temporary/fabric structures (tents, yurts, pavilions, canopies, marquees)`;
}
