/**
 * DNA Application Utilities
 * Applies LLM-generated DNA to hierarchy nodes
 */


/**
 * Apply DNA data to host node
 */
export function applyHostDNA(host: any, hostData: any): void {
  host.name = hostData.name;
  host.description = hostData.description;
  host.dna = hostData.dna;
  host.navigableElements = hostData.navigableElements;
  host.dominantElements = hostData.dominantElements;
  host.uniqueIdentifiers = hostData.uniqueIdentifiers;
  host.searchDesc = hostData.searchDesc;
  host.slug = hostData.slug;
}

/**
 * Apply DNA data to region nodes
 */
export function applyRegionDNA(host: any, regionsData: any[]): void {
  if (!host.regions || !regionsData) return;

  host.regions.forEach((region: any) => {
    const regionData = regionsData.find((r: any) => r.name === region.name);
    if (regionData) {
      region.name = regionData.name;
      region.description = regionData.description;
      region.dna = regionData.dna as any;
      region.navigableElements = regionData.navigableElements;
      region.dominantElements = regionData.dominantElements;
      region.uniqueIdentifiers = regionData.uniqueIdentifiers;
      region.searchDesc = regionData.searchDesc;
      region.slug = regionData.slug;
    }
  });
}

/**
 * Apply DNA data to location nodes
 */
export function applyLocationDNA(host: any, locationsData: any[]): void {
  if (!locationsData) return;

  for (const locData of locationsData) {
    const region = host.regions?.find((r: any) => r.name === locData.regionName);
    if (region && region.locations) {
      const location = region.locations.find((l: any) => l.name === locData.name);
      if (location) {
        location.name = locData.name;
        location.description = locData.description;
        location.dna = locData.dna as any;
        location.navigableElements = locData.navigableElements;
        location.dominantElements = locData.dominantElements;
        location.uniqueIdentifiers = locData.uniqueIdentifiers;
        location.searchDesc = locData.searchDesc;
        location.slug = locData.slug;
      }
    }
  }
}

/**
 * Apply DNA data to niche nodes
 */
export function applyNicheDNA(host: any, nichesData: any[]): void {
  if (!nichesData) return;

  for (const nicheData of nichesData) {
    for (const region of host.regions || []) {
      for (const location of region.locations || []) {
        if (location.niches) {
          const niche = location.niches.find((n: any) => n.name === nicheData.name);
          if (niche && location.name === nicheData.locationName) {
            niche.name = nicheData.name;
            niche.description = nicheData.description;
            niche.dna = nicheData.dna as any;
            niche.navigableElements = nicheData.navigableElements;
            niche.dominantElements = nicheData.dominantElements;
            niche.uniqueIdentifiers = nicheData.uniqueIdentifiers;
            niche.searchDesc = nicheData.searchDesc;
            niche.slug = nicheData.slug;
          }
        }
      }
    }
  }
}

/**
 * Find deepest node in hierarchy
 */
function findDeepestNode(host: any): any {
  if (host.regions && host.regions.length > 0) {
    const region = host.regions[0];
    if (region.locations && region.locations.length > 0) {
      const location = region.locations[0];
      if (location.niches && location.niches.length > 0) {
        return location.niches[0];
      }
      return location;
    }
    return region;
  }
  return host;
}

/**
 * Merge visual analysis data into deepest node
 */
export function mergeVisualAnalysis(host: any, visualAnalysis: any): void {
  if (!visualAnalysis) return;

  const targetNode = findDeepestNode(host);
  if (!targetNode || !targetNode.dna) return;

  // Scene fields go in DNA
  if (visualAnalysis.looks) targetNode.dna.looks = visualAnalysis.looks;
  if (visualAnalysis.atmosphere) targetNode.dna.atmosphere = visualAnalysis.atmosphere;
  if (visualAnalysis.mood) targetNode.dna.mood = visualAnalysis.mood;
  if (visualAnalysis.spatialLayout) targetNode.dna.spatialLayout = visualAnalysis.spatialLayout;
  
  // Map lighting to colorsAndLighting
  if (visualAnalysis.lighting) {
    targetNode.dna.colorsAndLighting = visualAnalysis.lighting;
  }
  
  // Map materials fields
  if (visualAnalysis.materials_primary) {
    targetNode.dna.primary_surfaces = visualAnalysis.materials_primary;
  }
  if (visualAnalysis.materials_secondary) {
    targetNode.dna.secondary_surfaces = visualAnalysis.materials_secondary;
  }
  if (visualAnalysis.materials_accents) {
    targetNode.dna.accent_features = visualAnalysis.materials_accents;
  }
  
  // Map color fields
  if (visualAnalysis.colors_dominant) {
    targetNode.dna.dominant = visualAnalysis.colors_dominant;
  }
  if (visualAnalysis.colors_secondary) {
    targetNode.dna.secondary = visualAnalysis.colors_secondary;
  }
  if (visualAnalysis.colors_accents) {
    targetNode.dna.accent = visualAnalysis.colors_accents;
  }
  if (visualAnalysis.colors_ambient) {
    targetNode.dna.ambient = visualAnalysis.colors_ambient;
  }
  
  // Structural fields go at node root (NOT in DNA)
  if (visualAnalysis.navigableElements) {
    targetNode.navigableElements = visualAnalysis.navigableElements;
  }
  if (visualAnalysis.dominantElements) {
    targetNode.dominantElements = visualAnalysis.dominantElements;
  }
  if (visualAnalysis.uniqueIdentifiers) {
    targetNode.uniqueIdentifiers = visualAnalysis.uniqueIdentifiers;
  }
  if (visualAnalysis.searchDesc) {
    targetNode.searchDesc = visualAnalysis.searchDesc;
  }
}
