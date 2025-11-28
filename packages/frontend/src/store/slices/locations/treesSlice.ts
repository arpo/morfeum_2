/**
 * Trees Slice - Tree structure management
 * Manages hierarchical relationships between nodes
 */

import { StateCreator } from 'zustand';
import { TreeNode, NodeType } from './types';
import { NodesSlice } from './nodesSlice';
import { UISlice } from './uiSlice';
import { deleteMediaByIds } from '@/services/mediaService';

export interface TreesSlice {
  worldTrees: TreeNode[];
  
  // Tree operations
  getWorldTree: (worldId: string) => TreeNode | undefined;
  addNodeToTree: (worldId: string, parentId: string | null, nodeId: string, type: NodeType) => void;
  removeNodeFromTree: (worldId: string, nodeId: string) => void;
  findNodeInTree: (tree: TreeNode, nodeId: string) => TreeNode | null;
  getTreePath: (worldId: string, nodeId: string) => string[];
  deleteWorldTree: (worldId: string) => void;
  deleteNodeWithChildren: (nodeId: string) => void;
  getWorldNodeCount: (worldId: string) => number;
  setCompleteWorldTree: (rootNode: any) => void;
}

// Tree traversal utilities
const findNodeInTreeRecursive = (tree: TreeNode, targetId: string): TreeNode | null => {
  if (tree.id === targetId) return tree;
  
  for (const child of tree.children) {
    const found = findNodeInTreeRecursive(child, targetId);
    if (found) return found;
  }
  
  return null;
};

const getAncestorsRecursive = (tree: TreeNode, targetId: string, path: string[] = []): string[] | null => {
  path.push(tree.id);
  
  if (tree.id === targetId) {
    return path;
  }
  
  for (const child of tree.children) {
    const found = getAncestorsRecursive(child, targetId, [...path]);
    if (found) return found;
  }
  
  return null;
};

const removeNodeFromTreeRecursive = (tree: TreeNode, targetId: string): boolean => {
  const index = tree.children.findIndex(c => c.id === targetId);
  if (index !== -1) {
    tree.children.splice(index, 1);
    return true;
  }
  
  for (const child of tree.children) {
    if (removeNodeFromTreeRecursive(child, targetId)) {
      return true;
    }
  }
  
  return false;
};

export const createTreesSlice: StateCreator<
  TreesSlice & NodesSlice & UISlice,
  [],
  [],
  TreesSlice
> = (set, get) => ({
  worldTrees: [],
  
  getWorldTree: (worldId) => {
    return get().worldTrees.find(tree => tree.id === worldId);
  },
  
  addNodeToTree: (worldId, parentId, nodeId, type) => {
    set((state) => {
      const trees = [...state.worldTrees];
      
      if (parentId === null) {
        // Adding a new world root
        trees.push({
          id: nodeId,
          type,
          children: [],
        });
      } else {
        // Adding to existing tree
        const worldTree = trees.find(t => t.id === worldId);
        if (!worldTree) {
          console.error(`[treesSlice] World tree not found: ${worldId}`);
          return state;
        }
        
        // Find parent and add child
        const addToParent = (node: TreeNode): boolean => {
          if (node.id === parentId) {
            node.children.push({
              id: nodeId,
              type,
              children: [],
            });
            return true;
          }
          
          for (const child of node.children) {
            if (addToParent(child)) return true;
          }
          
          return false;
        };
        
        if (!addToParent(worldTree)) {
          console.error(`[treesSlice] Parent node not found in tree: ${parentId}`);
          return state;
        }
      }
      
      return { worldTrees: trees };
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  },
  
  removeNodeFromTree: (worldId, nodeId) => {
    set((state) => {
      const trees = [...state.worldTrees];
      const worldTree = trees.find(t => t.id === worldId);
      
      if (!worldTree) return state;
      
      if (worldTree.id === nodeId) {
        // Removing entire world tree
        return {
          worldTrees: trees.filter(t => t.id !== worldId),
        };
      }
      
      removeNodeFromTreeRecursive(worldTree, nodeId);
      return { worldTrees: trees };
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  },
  
  findNodeInTree: (tree, nodeId) => {
    return findNodeInTreeRecursive(tree, nodeId);
  },
  
  getTreePath: (worldId, nodeId) => {
    const worldTree = get().getWorldTree(worldId);
    if (!worldTree) return [];
    
    const path = getAncestorsRecursive(worldTree, nodeId);
    return path || [];
  },
  
  deleteWorldTree: (worldId) => {
    const { nodes, worldTrees, pinnedIds } = get() as any; // Access from combined state
    
    // Find the world tree
    const treeIndex = worldTrees.findIndex((t: TreeNode) => t.id === worldId);
    if (treeIndex === -1) {
      console.warn('[treesSlice] World tree not found:', worldId);
      return;
    }
    
    // Collect node IDs and their media IDs
    const nodeIdsToDelete = new Set<string>();
    const mediaIdsToDelete = new Set<string>();
    
    const collectNodeAndMediaIds = (treeNode: TreeNode) => {
      nodeIdsToDelete.add(treeNode.id);
      
      // Get the node from flat map and collect its primaryMedia ID
      const node = nodes[treeNode.id];
      if (node?.primaryMedia) {
        mediaIdsToDelete.add(node.primaryMedia);
      }
      
      treeNode.children?.forEach(child => collectNodeAndMediaIds(child));
    };
    
    collectNodeAndMediaIds(worldTrees[treeIndex]);
    
    // Also check for orphaned nodes in flat map (nodes not in ANY tree)
    const allTreeNodeIds = new Set<string>();
    worldTrees.forEach((tree: TreeNode) => {
      const collectAll = (node: TreeNode) => {
        allTreeNodeIds.add(node.id);
        node.children?.forEach(child => collectAll(child));
      };
      collectAll(tree);
    });
    
    // Find orphaned nodes and their media
    Object.keys(nodes).forEach(nodeId => {
      if (!allTreeNodeIds.has(nodeId)) {
        nodeIdsToDelete.add(nodeId);
        const node = nodes[nodeId];
        if (node?.primaryMedia) {
          mediaIdsToDelete.add(node.primaryMedia);
        }
      }
    });
    
    // Delete all nodes from nodes map
    const newNodes = { ...nodes };
    nodeIdsToDelete.forEach(id => delete newNodes[id]);
    
    // Remove tree from worldTrees array
    const newTrees = worldTrees.filter((_: TreeNode, i: number) => i !== treeIndex);
    
    // Clean up pins
    const newPinnedIds = pinnedIds.filter((id: string) => !nodeIdsToDelete.has(id));
    
    // Delete media by media IDs (not by entity refs)
    if (mediaIdsToDelete.size > 0) {
      deleteMediaByIds(Array.from(mediaIdsToDelete));
    }
    
    set({
      nodes: newNodes,
      worldTrees: newTrees,
      pinnedIds: newPinnedIds
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  },
  
  deleteNodeWithChildren: (nodeId) => {
    const { nodes, worldTrees, pinnedIds } = get() as any;
    
    // Find which world tree contains this node
    let targetWorldId: string | null = null;
    let targetSubtree: TreeNode | null = null;
    
    for (const tree of worldTrees) {
      const findNode = (treeNode: TreeNode): TreeNode | null => {
        if (treeNode.id === nodeId) return treeNode;
        for (const child of treeNode.children) {
          const found = findNode(child);
          if (found) return found;
        }
        return null;
      };
      
      targetSubtree = findNode(tree);
      if (targetSubtree) {
        targetWorldId = tree.id;
        break;
      }
    }
    
    if (!targetSubtree || !targetWorldId) {
      console.warn('[treesSlice] Node not found in any tree:', nodeId);
      return;
    }
    
    // Collect node IDs and their media IDs
    const nodeIdsToDelete = new Set<string>();
    const mediaIdsToDelete = new Set<string>();
    
    const collectNodeAndMediaIds = (treeNode: TreeNode) => {
      nodeIdsToDelete.add(treeNode.id);
      
      // Get the node from flat map and collect its primaryMedia ID
      const node = nodes[treeNode.id];
      if (node?.primaryMedia) {
        mediaIdsToDelete.add(node.primaryMedia);
      }
      
      treeNode.children?.forEach(child => collectNodeAndMediaIds(child));
    };
    
    collectNodeAndMediaIds(targetSubtree);
    
    // Delete all nodes from nodes map
    const newNodes = { ...nodes };
    nodeIdsToDelete.forEach(id => delete newNodes[id]);
    
    // Remove the subtree from parent in the tree structure
    const newTrees = worldTrees.map((tree: TreeNode) => {
      if (tree.id !== targetWorldId) return tree;
      
      // Deep clone the tree and remove the target node
      const cloneTree = (node: TreeNode): TreeNode => ({
        ...node,
        children: node.children
          .filter(child => child.id !== nodeId)
          .map(child => cloneTree(child))
      });
      
      return cloneTree(tree);
    });
    
    // Clean up pins
    const newPinnedIds = pinnedIds.filter((id: string) => !nodeIdsToDelete.has(id));
    
    // Delete media by media IDs (not by entity refs)
    if (mediaIdsToDelete.size > 0) {
      deleteMediaByIds(Array.from(mediaIdsToDelete));
    }
    
    set({
      nodes: newNodes,
      worldTrees: newTrees,
      pinnedIds: newPinnedIds
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  },
  
  getWorldNodeCount: (worldId) => {
    const { worldTrees } = get();
    const tree = worldTrees.find(t => t.id === worldId);
    if (!tree) return 0;
    
    let count = 0;
    const traverse = (node: TreeNode) => {
      count++;
      node.children?.forEach(traverse);
    };
    traverse(tree);
    return count;
  },

  setCompleteWorldTree: (rootNode) => {
    const { nodes, worldTrees, pinnedIds } = get() as any;
    const newNodes = { ...nodes };
    const flatNodes: any[] = [];

    // Helper to flatten and convert to consistent format if needed
    // Backend TreeNode -> Frontend Node + Tree Structure
    // We assume backend format matches compatible structure
    
    const traverseAndFlatten = (node: any) => {
      // Add to flat nodes list
      // Ensure required fields for Node type
      const flatNode = {
        id: node.id,
        type: node.type,
        name: node.name,
        spaceType: node.spaceType || (node.type === 'niche' ? 'interior' : 'exterior'),
        dna: node.dna,
        description: node.description || '',
        // Inherit any other props
        ...node
      };
      
      // Remove children from flat node storage
      delete flatNode.children;
      
      flatNodes.push(flatNode);
      
      // Process children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverseAndFlatten(child));
      }
    };

    traverseAndFlatten(rootNode);

    // Update map
    flatNodes.forEach(node => {
      newNodes[node.id] = node;
    });

    // Add to world trees list (replacing if exists)
    const existingIndex = worldTrees.findIndex((t: any) => t.id === rootNode.id);
    let newWorldTrees = [...worldTrees];
    
    if (existingIndex >= 0) {
      newWorldTrees[existingIndex] = rootNode;
    } else {
      newWorldTrees.push(rootNode);
    }

    // Auto-pin the new world
    let newPinnedIds = [...pinnedIds];
    if (!pinnedIds.includes(rootNode.id)) {
      newPinnedIds.push(rootNode.id);
    }

    set({
      nodes: newNodes,
      worldTrees: newWorldTrees,
      pinnedIds: newPinnedIds
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  }
});
