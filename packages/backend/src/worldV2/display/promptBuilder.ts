/**
 * V2 Prompt Builder
 * 
 * DNA cascading utilities for V2 world nodes.
 * Used by displayHandler to merge host→region→location DNA.
 * 
 * FOLLOWS THE PATTERN FROM: packages/frontend/src/utils/nodeDNAExtractor.ts
 * - getMergedDNA() merges cascaded DNA with CSS-style inheritance
 * - Empty array = inherit from parent
 * - Non-empty array = REPLACE parent (not add to it)
 */

import type { DNA } from '../types';

/**
 * Cascaded DNA structure matching frontend pattern
 * See: packages/frontend/src/utils/nodeDNAExtractor.ts
 */
interface CascadedDNAChain {
  host?: DNA;
  region?: DNA;
  location?: DNA;
  space?: DNA;
}

/**
 * Merge DNA arrays using CSS-style inheritance
 * - Empty array = inherit from parent
 * - Non-empty array = REPLACE parent (not add to it)
 */
function mergeDNAArrays(parent: string[] = [], child: string[] = []): string[] {
  // Empty array = inherit from parent (CSS-style)
  if (child.length === 0) return parent;
  // Non-empty array = child REPLACES parent (CSS-style override)
  return child;
}

/**
 * Cascade DNA from host→region→location
 * Each level inherits from parent and adds its own deltas
 */
function cascadeDNA(dnaChain: CascadedDNAChain): DNA {
  const base: DNA = {
    essence: [],
    formsAndMaterials: [],
    colorAndLight: [],
    atmosphere: [],
    banned: []
  };

  // Merge host DNA
  if (dnaChain.host) {
    base.essence = mergeDNAArrays(base.essence, dnaChain.host.essence);
    base.formsAndMaterials = mergeDNAArrays(base.formsAndMaterials, dnaChain.host.formsAndMaterials);
    base.colorAndLight = mergeDNAArrays(base.colorAndLight, dnaChain.host.colorAndLight);
    base.atmosphere = mergeDNAArrays(base.atmosphere, dnaChain.host.atmosphere);
    base.banned = mergeDNAArrays(base.banned, dnaChain.host.banned);
  }

  // Merge region DNA (delta on top of host)
  if (dnaChain.region) {
    base.essence = mergeDNAArrays(base.essence, dnaChain.region.essence);
    base.formsAndMaterials = mergeDNAArrays(base.formsAndMaterials, dnaChain.region.formsAndMaterials);
    base.colorAndLight = mergeDNAArrays(base.colorAndLight, dnaChain.region.colorAndLight);
    base.atmosphere = mergeDNAArrays(base.atmosphere, dnaChain.region.atmosphere);
    base.banned = mergeDNAArrays(base.banned, dnaChain.region.banned);
  }

  // Merge location DNA (delta on top of region)
  if (dnaChain.location) {
    base.essence = mergeDNAArrays(base.essence, dnaChain.location.essence);
    base.formsAndMaterials = mergeDNAArrays(base.formsAndMaterials, dnaChain.location.formsAndMaterials);
    base.colorAndLight = mergeDNAArrays(base.colorAndLight, dnaChain.location.colorAndLight);
    base.atmosphere = mergeDNAArrays(base.atmosphere, dnaChain.location.atmosphere);
    base.banned = mergeDNAArrays(base.banned, dnaChain.location.banned);
  }

  return base;
}

/**
 * Merge source DNA into target, skipping empty arrays (CSS-style inheritance)
 * Mirrors: mergeNonNull from frontend/utils/nodeDNAExtractor.ts
 * 
 * - Empty array = skip (inherit parent value)
 * - Non-empty array = override (replace parent value)
 */
function mergeNonEmpty(target: DNA, source: DNA): void {
  for (const key of ['essence', 'formsAndMaterials', 'colorAndLight', 'atmosphere', 'banned'] as const) {
    const value = source[key];
    // Only override if array has items (CSS-style: non-empty = override)
    if (Array.isArray(value) && value.length > 0) {
      target[key] = value;
    }
  }
}

/**
 * Merge cascaded DNA into flat object with CSS-style inheritance
 * Mirrors: getMergedDNA from frontend/utils/nodeDNAExtractor.ts
 * 
 * USAGE:
 *   const merged = getMergedDNA({ host, region, location, space });
 * 
 * INHERITANCE:
 *   - Start with host DNA as base
 *   - Override with region DNA (skip empty arrays)
 *   - Override with location DNA (skip empty arrays)
 *   - Override with space DNA (skip empty arrays)
 * 
 * EXAMPLE:
 *   Input:
 *   {
 *     host: { essence: ["gothic", "haunted"], colorAndLight: ["shadows"] },
 *     region: { essence: [], colorAndLight: ["fog"] },
 *     location: { essence: ["ominous"], colorAndLight: [] }
 *   }
 * 
 *   Output:
 *   {
 *     essence: ["ominous"],        // from location (override)
 *     colorAndLight: ["fog"]       // from region (location was empty = inherit)
 *   }
 */
function getMergedDNA(cascadedDNA: CascadedDNAChain): DNA {
  const merged: DNA = {
    essence: [],
    formsAndMaterials: [],
    colorAndLight: [],
    atmosphere: [],
    banned: []
  };
  
  // Start with host DNA as base layer
  if (cascadedDNA.host) {
    mergeNonEmpty(merged, cascadedDNA.host);
  }
  
  // Override with region DNA (skip empty arrays)
  if (cascadedDNA.region) {
    mergeNonEmpty(merged, cascadedDNA.region);
  }
  
  // Override with location DNA (skip empty arrays)
  if (cascadedDNA.location) {
    mergeNonEmpty(merged, cascadedDNA.location);
  }
  
  // Override with space DNA (skip empty arrays)
  if (cascadedDNA.space) {
    mergeNonEmpty(merged, cascadedDNA.space);
  }
  
  return merged;
}

export { cascadeDNA, getMergedDNA, CascadedDNAChain, mergeDNAArrays };
