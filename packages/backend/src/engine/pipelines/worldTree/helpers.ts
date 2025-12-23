/**
 * World Tree Pipeline Helpers
 * Utility functions for world tree generation
 */

import type { HierarchyStructure, HierarchyNode } from '../../hierarchyAnalysis/types';
import type { HierarchyNodeInfo } from '../../generation/prompts/locations/parentChainDNA';
import type { TreeNode } from '../../../services/worldTree/types';
import mediaService from '../../../services/media/mediaService';

/**
 * Assign media to tree nodes
 * Creates media entry and sets primaryMedia on the deepest node
 */
export function assignMediaToTreeNodes(
  tree: TreeNode,
  imageUrl: string,
  imagePrompt: string
): TreeNode {
  // Find the deepest node in the tree
  function findDeepestNode(node: TreeNode): TreeNode {
    if (!node.children || node.children.length === 0) {
      return node;
    }
    return findDeepestNode(node.children[0]);
  }

  const deepestNode = findDeepestNode(tree);

  // Create media entry for the image
  const media = mediaService.createMedia({
    type: 'image',
    url: imageUrl,
    metadata: {
      prompt: imagePrompt,
      model: 'FLUX',
    },
    entityRefs: [deepestNode.id]
  });

  // Set primaryMedia on the deepest node
  deepestNode.primaryMedia = media.id;

  return tree;
}

/**
 * Extract deepest node and parent chain from hierarchy
 */
export function extractDeepestNodeInfo(hierarchy: HierarchyStructure): {
  deepestNode: HierarchyNode;
  deepestNodeType: 'host' | 'region' | 'location' | 'niche';
  parentChain: Array<{ type: string; name: string; description: string }>;
} {
  const parentChain: Array<{ type: string; name: string; description: string }> = [];
  let deepestNode: HierarchyNode = hierarchy.host;
  let deepestNodeType: 'host' | 'region' | 'location' | 'niche' = 'host';

  // Check for regions
  if (hierarchy.host.regions && hierarchy.host.regions.length > 0) {
    parentChain.push({
      type: 'host',
      name: hierarchy.host.name,
      description: hierarchy.host.description
    });
    
    const region = hierarchy.host.regions[0];
    deepestNode = region;
    deepestNodeType = 'region';

    // Check for locations
    if (region.locations && region.locations.length > 0) {
      parentChain.push({
        type: 'region',
        name: region.name,
        description: region.description
      });
      
      const location = region.locations[0];
      deepestNode = location;
      deepestNodeType = 'location';

      // Check for niches
      if (location.niches && location.niches.length > 0) {
        parentChain.push({
          type: 'location',
          name: location.name,
          description: location.description
        });
        
        const niche = location.niches[0];
        deepestNode = niche;
        deepestNodeType = 'niche';
      }
    }
  }

  return { deepestNode, deepestNodeType, parentChain };
}

/**
 * Extract parent nodes for DNA generation (excludes deepest node)
 */
export function extractParentNodesForDNA(hierarchy: HierarchyStructure, deepestNodeType: string): HierarchyNodeInfo[] {
  const parentNodes: HierarchyNodeInfo[] = [];

  // Always add host if deepest is not host
  if (deepestNodeType !== 'host') {
    parentNodes.push({
      type: 'host',
      name: hierarchy.host.name,
      description: hierarchy.host.description
    });
  }

  // Add region if deepest is location or niche
  if ((deepestNodeType === 'location' || deepestNodeType === 'niche') && 
      hierarchy.host.regions && hierarchy.host.regions.length > 0) {
    const region = hierarchy.host.regions[0];
    parentNodes.push({
      type: 'region',
      name: region.name,
      description: region.description
    });
  }

  // Add location if deepest is niche
  if (deepestNodeType === 'niche' && 
      hierarchy.host.regions && hierarchy.host.regions.length > 0 &&
      hierarchy.host.regions[0].locations && hierarchy.host.regions[0].locations.length > 0) {
    const location = hierarchy.host.regions[0].locations[0];
    parentNodes.push({
      type: 'location',
      name: location.name,
      description: location.description
    });
  }

  // Return in order from deepest parent to host (bottom-up)
  return parentNodes.reverse();
}
