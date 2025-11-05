/**
 * Node DNA Extractor Utility
 * 
 * PURPOSE: Extract clean DNA from backend hierarchy nodes
 * 
 * PROBLEM: Backend sends nested structures where parent nodes contain
 *          child arrays (host.regions, region.locations, location.niches).
 *          Storing these creates duplicate data and confusing displays.
 * 
 * SOLUTION: Strip nested child arrays, keep only node-specific data.
 * 
 * USAGE:
 *   import { extractCleanDNA } from '@/utils/nodeDNAExtractor';
 *   const cleanDNA = extractCleanDNA(backendHostData, 'host');
 * 
 * EXAMPLE:
 *   Backend host data:
 *   {
 *     name: "Gothic Realm",
 *     architectural_tone: "...",
 *     regions: [{ name: "...", locations: [...] }]  // ← This gets stripped
 *   }
 * 
 *   Result:
 *   {
 *     name: "Gothic Realm",
 *     architectural_tone: "...",
 *     slug: "gothic-realm"
 *     // regions array removed ✅
 *   }
 */

export type NodeType = 'host' | 'region' | 'location' | 'niche';

/**
 * Fields to exclude for each node type
 * These are the nested child arrays that shouldn't be stored in node.dna
 */
const EXCLUSIONS: Record<NodeType, string[]> = {
  host: ['regions'],           // Don't store child regions array
  region: ['locations'],       // Don't store child locations array
  location: ['niches'],        // Don't store child niches array
  niche: []                    // No children to exclude
};

/**
 * Metadata fields handled separately (not part of DNA content)
 */
const METADATA_FIELDS = ['imageUrl', 'slug'];

/**
 * Extract clean DNA from a backend node, excluding nested child arrays
 * 
 * @param nodeData - Raw node data from backend (may contain nested arrays)
 * @param nodeType - Type of node being extracted
 * @returns Clean DNA object with nested arrays removed
 */
export function extractCleanDNA(
  nodeData: any,
  nodeType: NodeType
): any {
  if (!nodeData || typeof nodeData !== 'object') {
    return {};
  }

  // Get exclusion list for this node type
  const excludedFields = [
    ...EXCLUSIONS[nodeType],
    ...METADATA_FIELDS
  ];
  
  // Create clean object excluding nested arrays and metadata
  const cleanDNA: any = {};
  
  for (const key in nodeData) {
    if (!excludedFields.includes(key)) {
      cleanDNA[key] = nodeData[key];
    }
  }
  
  // Add slug if missing
  if (!cleanDNA.slug && nodeData.name) {
    cleanDNA.slug = generateSlug(nodeData.name);
  }
  
  return cleanDNA;
}

/**
 * Merge cascaded DNA into flat object with inheritance
 * 
 * PURPOSE: Combine hierarchical DNA (world→region→location→niche) into single flat object
 * 
 * USAGE:
 *   const cascaded = getCascadedDNA(nodeId);
 *   const merged = getMergedDNA(cascaded);
 * 
 * INHERITANCE:
 *   - Start with host/world DNA as base
 *   - Override with region DNA (skip null values)
 *   - Override with location DNA (skip null values)
 *   - Override with niche DNA (skip null values)
 * 
 * EXAMPLE:
 *   Input (cascaded):
 *   {
 *     world: { architectural_tone: "gothic", mood: "dark" },
 *     region: { architectural_tone: null, mood: null },
 *     location: { mood: "cheerful" }
 *   }
 * 
 *   Output (merged):
 *   {
 *     architectural_tone: "gothic",  // ← from world (region was null)
 *     mood: "cheerful"               // ← from location (overrides world)
 *   }
 */
export function getMergedDNA(cascadedDNA: {
  world?: any;
  region?: any;
  location?: any;
  sublocation?: any;
}): any {
  const merged: any = {};
  
  // Start with host/world DNA as base layer
  if (cascadedDNA.world) {
    Object.assign(merged, cascadedDNA.world);
  }
  
  // Override with region DNA (skip null/undefined values)
  if (cascadedDNA.region) {
    mergeNonNull(merged, cascadedDNA.region);
  }
  
  // Override with location DNA (skip null/undefined values)
  if (cascadedDNA.location) {
    mergeNonNull(merged, cascadedDNA.location);
  }
  
  // Override with niche/sublocation DNA (skip null/undefined values)
  if (cascadedDNA.sublocation) {
    mergeNonNull(merged, cascadedDNA.sublocation);
  }
  
  return merged;
}

/**
 * Merge source into target, skipping null/undefined values
 * This allows child nodes to inherit parent values when they don't override
 */
function mergeNonNull(target: any, source: any): void {
  for (const key in source) {
    const value = source[key];
    // Only override if value is not null/undefined
    if (value !== null && value !== undefined) {
      target[key] = value;
    }
  }
}

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
