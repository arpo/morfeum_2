/**
 * Node Creation Pipeline Helpers
 * Utility functions for hierarchy building and DNA processing
 */

import mediaService from '../../../services/media/mediaService';
import type { TreeNode } from '../../../services/worldTree/types';
import type { HierarchyNodeInfo } from '../../generation/prompts/locations/parentChainDNA';
import type { ImagePromptStructure } from '../../generation/shared/imagePromptTypes';

/**
 * Clean unwanted DNA fields that LLM sometimes adds
 */
export function cleanDNA(dna: any): any {
  if (!dna) return dna;
  const cleaned = { ...dna };
  delete cleaned.semantic;
  delete cleaned.visual;
  delete cleaned.profile;
  return cleaned;
}

/**
 * Build hierarchy structure from parsed response + DNA data
 * @param regionIsPassThrough - If true, create minimal pass-through region
 * 
 * Note: navigableElements, dominantElements, uniqueIdentifiers only set for location/niche, not host/region
 */
export function buildHierarchyStructure(
  parsedHierarchy: any,
  deepestNodeDNA: any,
  parentDNA: any,
  deepestType: string,
  regionIsPassThrough: boolean = false
): any {
  const structure: any = {
    host: null
  };

  // Get DNA for each level
  const hostDNA = parentDNA?.host || null;
  const regionDNA = parentDNA?.region || null;
  const locationDNA = parentDNA?.location || null;

  // Build host (no structural fields - hosts don't need navigableElements etc.)
  if (parsedHierarchy.host) {
    structure.host = {
      type: 'host',
      name: hostDNA?.name || parsedHierarchy.host.name,
      description: hostDNA?.description || parsedHierarchy.host.description,
      dna: cleanDNA(hostDNA?.dna || (deepestType === 'host' ? deepestNodeDNA.dna : null)),
      searchDesc: hostDNA?.searchDesc || (deepestType === 'host' ? deepestNodeDNA.searchDesc : ''),
      slug: hostDNA?.slug || (deepestType === 'host' ? deepestNodeDNA.slug : ''),
      regions: [],
    };
  }

  if (!structure.host) return null;

  // Build region (no structural fields - regions don't need navigableElements etc.)
  if (parsedHierarchy.region) {
    // Check if this should be a pass-through region
    if (regionIsPassThrough && deepestType !== 'region') {
      // Create minimal pass-through region (no DNA, inherits from host)
      structure.host.regions = [{
        type: 'region',
        name: 'Region',
        description: '',
        isPassThrough: true,
        dna: null,
        slug: 'region',
        locations: [],
      }];
    } else {
      // Create normal region with full DNA but no structural fields
      structure.host.regions = [{
        type: 'region',
        name: regionDNA?.name || parsedHierarchy.region.name,
        description: regionDNA?.description || parsedHierarchy.region.description,
        dna: cleanDNA(regionDNA?.dna || (deepestType === 'region' ? deepestNodeDNA.dna : null)),
        searchDesc: regionDNA?.searchDesc || (deepestType === 'region' ? deepestNodeDNA.searchDesc : ''),
        slug: regionDNA?.slug || (deepestType === 'region' ? deepestNodeDNA.slug : ''),
        locations: [],
      }];
    }

    // Build location (includes structural fields)
    if (parsedHierarchy.location) {
      structure.host.regions[0].locations = [{
        type: 'location',
        name: locationDNA?.name || parsedHierarchy.location.name,
        description: locationDNA?.description || parsedHierarchy.location.description,
        dna: cleanDNA(locationDNA?.dna || (deepestType === 'location' ? deepestNodeDNA.dna : null)),
        searchDesc: locationDNA?.searchDesc || (deepestType === 'location' ? deepestNodeDNA.searchDesc : ''),
        slug: locationDNA?.slug || (deepestType === 'location' ? deepestNodeDNA.slug : ''),
        // Locations DO get structural fields
        navigableElements: locationDNA?.navigableElements || (deepestType === 'location' ? deepestNodeDNA.navigableElements : []),
        dominantElements: locationDNA?.dominantElements || (deepestType === 'location' ? deepestNodeDNA.dominantElements : []),
        uniqueIdentifiers: locationDNA?.uniqueIdentifiers || (deepestType === 'location' ? deepestNodeDNA.uniqueIdentifiers : []),
        niches: [],
      }];

      // Build niche (includes structural fields)
      if (parsedHierarchy.niche) {
        structure.host.regions[0].locations[0].niches = [{
          type: 'niche',
          name: deepestNodeDNA.name || parsedHierarchy.niche.name,
          description: deepestNodeDNA.description || parsedHierarchy.niche.description,
          dna: cleanDNA(deepestNodeDNA.dna),
          searchDesc: deepestNodeDNA.searchDesc || '',
          slug: deepestNodeDNA.slug || '',
          // Niches DO get structural fields
          navigableElements: deepestNodeDNA.navigableElements || [],
          dominantElements: deepestNodeDNA.dominantElements || [],
          uniqueIdentifiers: deepestNodeDNA.uniqueIdentifiers || [],
        }];
      }
    }
  }

  return structure;
}

/**
 * Find the deepest node in the tree and assign media
 */
export function assignMediaToTree(
  tree: TreeNode,
  imageUrl: string,
  imagePrompt: string,
  promptStructure?: ImagePromptStructure
): TreeNode {
  function findDeepestNode(node: TreeNode): TreeNode {
    if (!node.children || node.children.length === 0) {
      return node;
    }
    return findDeepestNode(node.children[0]);
  }

  const deepestNode = findDeepestNode(tree);

  // Create media entry with structured prompt for reuse
  const media = mediaService.createMedia({
    type: 'image',
    url: imageUrl,
    metadata: {
      prompt: imagePrompt,
      promptStructure, // Store structured prompt for character placement, regeneration, etc.
      model: 'FLUX',
    },
    entityRefs: [deepestNode.id]
  });

  deepestNode.primaryMedia = media.id;

  return tree;
}

/**
 * Extract parent nodes for DNA generation
 * @param regionIsPassThrough - If true, skip region DNA generation
 */
export function extractParentNodes(
  parsedHierarchy: any,
  deepestType: string,
  regionIsPassThrough: boolean = false
): HierarchyNodeInfo[] {
  const parents: HierarchyNodeInfo[] = [];

  // Add host if deepest is not host
  if (deepestType !== 'host' && parsedHierarchy.host) {
    parents.push({
      type: 'host',
      name: parsedHierarchy.host.name,
      description: parsedHierarchy.host.description,
    });
  }

  // Add region if deepest is location or niche (SKIP if pass-through)
  if ((deepestType === 'location' || deepestType === 'niche') && parsedHierarchy.region && !regionIsPassThrough) {
    parents.push({
      type: 'region',
      name: parsedHierarchy.region.name,
      description: parsedHierarchy.region.description,
    });
  }

  // Add location if deepest is niche
  if (deepestType === 'niche' && parsedHierarchy.location) {
    parents.push({
      type: 'location',
      name: parsedHierarchy.location.name,
      description: parsedHierarchy.location.description,
    });
  }

  // Return in order from deepest parent to host (bottom-up)
  return parents.reverse();
}

/**
 * Build parent chain for context in DNA generation
 */
export function buildParentChain(
  parsedHierarchy: any,
  deepestType: string
): Array<{ type: string; name: string; description: string }> {
  const chain: Array<{ type: string; name: string; description: string }> = [];

  if (deepestType === 'host') return chain;

  if (parsedHierarchy.host) {
    chain.push({
      type: 'host',
      name: parsedHierarchy.host.name,
      description: parsedHierarchy.host.description,
    });
  }

  if (deepestType === 'region') return chain;

  if (parsedHierarchy.region) {
    chain.push({
      type: 'region',
      name: parsedHierarchy.region.name,
      description: parsedHierarchy.region.description,
    });
  }

  if (deepestType === 'location') return chain;

  if (parsedHierarchy.location) {
    chain.push({
      type: 'location',
      name: parsedHierarchy.location.name,
      description: parsedHierarchy.location.description,
    });
  }

  return chain;
}

/**
 * Get deepest node info from parsed hierarchy
 */
export function getDeepestNodeInfo(parsedHierarchy: any): {
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
} {
  if (parsedHierarchy.niche) {
    return {
      type: 'niche',
      name: parsedHierarchy.niche.name,
      description: parsedHierarchy.niche.description,
    };
  }
  if (parsedHierarchy.location) {
    return {
      type: 'location',
      name: parsedHierarchy.location.name,
      description: parsedHierarchy.location.description,
    };
  }
  if (parsedHierarchy.region) {
    return {
      type: 'region',
      name: parsedHierarchy.region.name,
      description: parsedHierarchy.region.description,
    };
  }
  return {
    type: 'host',
    name: parsedHierarchy.host.name,
    description: parsedHierarchy.host.description,
  };
}
