/**
 * World Tree DNA Application
 * Functions for applying DNA to hierarchy nodes
 */

import type { HierarchyStructure } from '../../hierarchyAnalysis/types';

/**
 * Apply deepest node DNA to the hierarchy
 * Note: navigableElements, dominantElements, uniqueIdentifiers only set for location/niche, not host/region
 */
export function applyDeepestNodeDNA(hierarchy: HierarchyStructure, deepestNodeType: string, dnaData: any): void {
  let targetNode: any;

  switch (deepestNodeType) {
    case 'host':
      targetNode = hierarchy.host;
      break;
    case 'region':
      targetNode = hierarchy.host.regions?.[0];
      break;
    case 'location':
      targetNode = hierarchy.host.regions?.[0]?.locations?.[0];
      break;
    case 'niche':
      targetNode = hierarchy.host.regions?.[0]?.locations?.[0]?.niches?.[0];
      break;
  }

  if (targetNode && dnaData) {
    targetNode.name = dnaData.name || targetNode.name;
    targetNode.description = dnaData.description || targetNode.description;
    targetNode.dna = dnaData.dna;
    targetNode.searchDesc = dnaData.searchDesc;
    targetNode.slug = dnaData.slug;
    
    // Only set structural fields for location/niche, not host/region
    if (deepestNodeType === 'location' || deepestNodeType === 'niche') {
      targetNode.navigableElements = dnaData.navigableElements;
      targetNode.dominantElements = dnaData.dominantElements;
      targetNode.uniqueIdentifiers = dnaData.uniqueIdentifiers;
    }
  }
}

/**
 * Apply parent chain DNA to the hierarchy
 * Note: navigableElements, dominantElements, uniqueIdentifiers only set for location, not host/region
 */
export function applyParentChainDNA(hierarchy: HierarchyStructure, parentDNA: any): void {
  // Apply host DNA (no structural fields - hosts don't need navigableElements etc.)
  if (parentDNA.host) {
    hierarchy.host.name = parentDNA.host.name || hierarchy.host.name;
    hierarchy.host.description = parentDNA.host.description || hierarchy.host.description;
    hierarchy.host.dna = parentDNA.host.dna;
    hierarchy.host.searchDesc = parentDNA.host.searchDesc;
    hierarchy.host.slug = parentDNA.host.slug;
    // Skip: navigableElements, dominantElements, uniqueIdentifiers (not needed for host)
  }

  // Apply region DNA (no structural fields - regions don't need navigableElements etc.)
  if (parentDNA.region && hierarchy.host.regions && hierarchy.host.regions.length > 0) {
    const region = hierarchy.host.regions[0];
    region.name = parentDNA.region.name || region.name;
    region.description = parentDNA.region.description || region.description;
    region.dna = parentDNA.region.dna;
    region.searchDesc = parentDNA.region.searchDesc;
    region.slug = parentDNA.region.slug;
    // Skip: navigableElements, dominantElements, uniqueIdentifiers (not needed for region)
  }

  // Apply location DNA (includes structural fields)
  if (parentDNA.location && 
      hierarchy.host.regions && hierarchy.host.regions.length > 0 &&
      hierarchy.host.regions[0].locations && hierarchy.host.regions[0].locations.length > 0) {
    const location = hierarchy.host.regions[0].locations[0];
    location.name = parentDNA.location.name || location.name;
    location.description = parentDNA.location.description || location.description;
    location.dna = parentDNA.location.dna;
    location.searchDesc = parentDNA.location.searchDesc;
    location.slug = parentDNA.location.slug;
    // Locations DO get structural fields
    location.navigableElements = parentDNA.location.navigableElements;
    location.dominantElements = parentDNA.location.dominantElements;
    location.uniqueIdentifiers = parentDNA.location.uniqueIdentifiers;
  }
}
