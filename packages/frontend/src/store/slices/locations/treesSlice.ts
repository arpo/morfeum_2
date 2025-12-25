/**
 * Trees Slice - Tree structure management
 * Manages hierarchical relationships between nodes
 */

import { StateCreator } from 'zustand';
import { TreeNode, NodeType } from './types';
import { NodesSlice } from './nodesSlice';
import { UISlice } from './uiSlice';
import { 
  deleteWorldTree as deleteWorldTreeOp, 
  deleteNodeWithChildren as deleteNodeWithChildrenOp 
} from './treeDeletion';
import {
  findNodeInTreeRecursive,
  getAncestorsRecursive,
  removeNodeFromTreeRecursive,
  extractTreeStructure
} from './treeTraversal';

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
        trees.push({
          id: nodeId,
          type,
          children: [],
        });
      } else {
        const worldTree = trees.find(t => t.id === worldId);
        if (!worldTree) {
          console.error(`[treesSlice] World tree not found: ${worldId}`);
          return state;
        }
        
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
    
    (get() as any).saveToBackend?.();
  },
  
  removeNodeFromTree: (worldId, nodeId) => {
    set((state) => {
      const trees = [...state.worldTrees];
      const worldTree = trees.find(t => t.id === worldId);
      
      if (!worldTree) return state;
      
      if (worldTree.id === nodeId) {
        return {
          worldTrees: trees.filter(t => t.id !== worldId),
        };
      }
      
      removeNodeFromTreeRecursive(worldTree, nodeId);
      return { worldTrees: trees };
    });
    
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
    const state = get() as any;
    const result = deleteWorldTreeOp(worldId, {
      nodes: state.nodes,
      worldTrees: state.worldTrees,
      pinnedIds: state.pinnedIds
    });
    
    set(result);
    (get() as any).saveToBackend?.();
  },
  
  deleteNodeWithChildren: (nodeId) => {
    const state = get() as any;
    const result = deleteNodeWithChildrenOp(nodeId, {
      nodes: state.nodes,
      worldTrees: state.worldTrees,
      pinnedIds: state.pinnedIds
    });
    
    set(result);
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
    
    const traverseAndFlatten = (node: any) => {
      const flatNode = {
        id: node.id,
        type: node.type,
        name: node.name,
        spaceType: node.spaceType || (node.type === 'niche' ? 'interior' : 'exterior'),
        dna: node.dna,
        description: node.description || '',
        ...node
      };
      
      delete flatNode.children;
      flatNodes.push(flatNode);
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverseAndFlatten(child));
      }
    };

    traverseAndFlatten(rootNode);

    flatNodes.forEach(node => {
      newNodes[node.id] = node;
    });

    const treeStructure = extractTreeStructure(rootNode);
    
    const existingIndex = worldTrees.findIndex((t: any) => t.id === rootNode.id);
    let newWorldTrees = [...worldTrees];
    
    if (existingIndex >= 0) {
      newWorldTrees[existingIndex] = treeStructure;
    } else {
      newWorldTrees.push(treeStructure);
    }

    let newPinnedIds = [...pinnedIds];
    if (!pinnedIds.includes(rootNode.id)) {
      newPinnedIds.push(rootNode.id);
    }

    set({
      nodes: newNodes,
      worldTrees: newWorldTrees,
      pinnedIds: newPinnedIds
    });
    
    (get() as any).saveToBackend?.();
  }
});
