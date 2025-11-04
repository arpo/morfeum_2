/**
 * DNA Slice - DNA operations and spatial navigation
 * Handles DNA cascading from tree paths and spatial relationships
 */

import { StateCreator } from 'zustand';
import { CascadedDNA, Node, HostNode, RegionNode, LocationNode, NicheNode, TreeNode } from './types';
import { NodesSlice } from './nodesSlice';
import { TreesSlice } from './treesSlice';

export interface DNASlice {
  // DNA operations
  getCascadedDNA: (nodeId: string) => CascadedDNA;
  
  // Spatial navigation
  getSpatialNodes: (currentNodeId: string) => Node[];
}

// Helper to get siblings in tree
const getSiblingsInTree = (tree: TreeNode, targetId: string, parentId: string | null = null): string[] => {
  if (parentId === null) {
    return [];
  }
  
  const findParent = (node: TreeNode): TreeNode | null => {
    if (node.id === parentId) return node;
    for (const child of node.children) {
      const found = findParent(child);
      if (found) return found;
    }
    return null;
  };
  
  const parent = findParent(tree);
  if (!parent) return [];
  
  return parent.children.filter(c => c.id !== targetId).map(c => c.id);
};

// Helper to get descendants
const getDescendantsRecursive = (tree: TreeNode): string[] => {
  const descendants: string[] = [];
  
  for (const child of tree.children) {
    descendants.push(child.id);
    descendants.push(...getDescendantsRecursive(child));
  }
  
  return descendants;
};

export const createDNASlice: StateCreator<
  DNASlice & NodesSlice & TreesSlice,
  [],
  [],
  DNASlice
> = (set, get) => ({
  getCascadedDNA: (nodeId) => {
    const node = get().getNode(nodeId);
    if (!node) return {};
    
    // Find world tree containing this node
    const worldTrees = get().worldTrees;
    const worldTree = worldTrees.find(tree => 
      get().findNodeInTree(tree, nodeId) !== null
    );
    
    if (!worldTree) return {};
    
    // Get path from world root to this node
    const path = get().getTreePath(worldTree.id, nodeId);
    
    // Collect DNA from each node in path
    const cascaded: CascadedDNA = {};
    
    for (const id of path) {
      const pathNode = get().getNode(id);
      if (!pathNode) continue;
      
      switch (pathNode.type) {
        case 'host':
          cascaded.world = pathNode.dna as HostNode;
          break;
        case 'region':
          cascaded.region = pathNode.dna as RegionNode;
          break;
        case 'location':
          cascaded.location = pathNode.dna as LocationNode;
          break;
        case 'niche':
          cascaded.sublocation = pathNode.dna as NicheNode;
          break;
      }
    }
    
    return cascaded;
  },
  
  getSpatialNodes: (currentNodeId) => {
    const currentNode = get().getNode(currentNodeId);
    if (!currentNode) return [];
    
    // Find world tree containing this node
    const worldTrees = get().worldTrees;
    const worldTree = worldTrees.find(tree => 
      get().findNodeInTree(tree, currentNodeId) !== null
    );
    
    if (!worldTree) return [];
    
    const spatialIds = new Set<string>();
    
    // Add current node
    spatialIds.add(currentNodeId);
    
    // Get path (ancestors)
    const path = get().getTreePath(worldTree.id, currentNodeId);
    path.forEach(id => spatialIds.add(id));
    
    // Get parent ID
    const parentId = path.length > 1 ? path[path.length - 2] : null;
    
    // Get siblings
    const siblings = getSiblingsInTree(worldTree, currentNodeId, parentId);
    siblings.forEach(id => spatialIds.add(id));
    
    // Get children
    const currentTreeNode = get().findNodeInTree(worldTree, currentNodeId);
    if (currentTreeNode) {
      const children = getDescendantsRecursive(currentTreeNode);
      children.forEach(id => spatialIds.add(id));
    }
    
    // Convert IDs to nodes
    return Array.from(spatialIds)
      .map(id => get().getNode(id))
      .filter(Boolean) as Node[];
  },
});
