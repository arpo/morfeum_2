/**
 * V2 Prompt Builder
 * 
 * DNA cascading utilities for V2 world nodes.
 * Used by displayHandler to merge host→region→location DNA.
 */

import type { DNA } from '../types';

interface CascadedDNAChain {
  host?: DNA;
  region?: DNA;
  location?: DNA;
}

/**
 * Merge DNA arrays, combining parent and child values
 * Child values come after parent values for emphasis
 */
function mergeDNAArrays(parent: string[] = [], child: string[] = []): string[] {
  // If child is empty, inherit parent
  if (child.length === 0) return parent;
  // Combine both, child additions come after
  return [...parent, ...child];
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

export { cascadeDNA, CascadedDNAChain };
