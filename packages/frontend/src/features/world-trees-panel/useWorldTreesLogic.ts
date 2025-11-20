import { useState, useMemo, useCallback } from 'react';
import { useLocationsStore, Node } from '@/store/slices/locations';
import { useStore } from '@/store';
import type { WorldTreesLogicReturn, TreeNode } from './types';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';

export function useWorldTreesLogic(): WorldTreesLogicReturn {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const nodes = useLocationsStore(state => state.nodes);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const pinnedIds = useLocationsStore(state => state.pinnedIds);
  const togglePinned = useLocationsStore(state => state.togglePinned);
  const getCascadedDNA = useLocationsStore(state => state.getCascadedDNA);
  const activeEntity = useStore(state => state.activeEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const createEntity = useStore(state => state.createEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);

  const pinnedWorldTrees = useMemo(() => {
    // Helper to check if a node or any of its descendants is expanded
    // Actually we just want to build the tree for pinned worlds
    
    const buildTree = (nodeId: string, depth: number = 0): TreeNode | null => {
      const node = nodes[nodeId];
      if (!node) return null;

      // Find tree structure for children
      const findNodeInTree = (tree: any, id: string): any => {
        if (tree.id === id) return tree;
        if (tree.children) {
          for (const child of tree.children) {
            const found = findNodeInTree(child, id);
            if (found) return found;
          }
        }
        return null;
      };

      let treeData = null;
      for (const tree of worldTrees) {
        treeData = findNodeInTree(tree, nodeId);
        if (treeData) break;
      }

      const children: TreeNode[] = [];
      if (treeData && treeData.children) {
        treeData.children.forEach((child: any) => {
          const childNode = buildTree(child.id, depth + 1);
          if (childNode) {
            children.push(childNode);
          }
        });
      }

      return {
        id: nodeId,
        node,
        children,
        isExpanded: expandedNodes.has(nodeId),
        depth
      };
    };

    // Filter to pinned host nodes
    return pinnedIds
      .map(id => nodes[id])
      .filter(node => node && node.type === 'host')
      .map(node => buildTree(node.id))
      .filter((tree): tree is TreeNode => tree !== null);

  }, [nodes, worldTrees, pinnedIds, expandedNodes]);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    // Load the node as active entity
    const node = nodes[nodeId];
    if (!node) return;
    
    const entities = useStore.getState().entities;
    
    // If session missing, create it (and potentially siblings/whole tree if logical)
    // We'll perform a lightweight load for just this node to be fast, 
    // OR stick to the robust "load tree" logic which is safer for consistency.
    // Since we are in WorldTreesPanel, we are navigating a tree. It makes sense to ensure
    // the whole tree is ready.
    
    if (!entities.has(nodeId)) {
      // Get cascaded DNA for correct profile
      const cascadedDNA = getCascadedDNA(nodeId);
      
      if (!cascadedDNA.world) {
         console.warn('Cannot load node without world DNA:', nodeId);
         // Fallback: try to load just this node with minimal info if possible, or return
         // return; 
      }
      
      // Create session for this node immediately
      const seed = {
        name: node.name,
        atmosphere: cascadedDNA.world?.semantic?.atmosphere || (node.dna as any)?.semantic?.atmosphere || 'Unknown'
      };
      
      createEntity(nodeId, seed, 'location');
      
      if (node.imagePath) {
        updateEntityImage(nodeId, node.imagePath);
      }
      
      updateEntityProfile(nodeId, cascadedDNA as any);
      
      // Also, ideally we should make sure the whole tree is loaded
      // But for performance on click, maybe just this node is enough for now?
      // The user said: "if i click on it it doesn't load in the preview panel".
      // Creating the session here fixes that.
    }

    setActiveEntity(nodeId);
  }, [nodes, setActiveEntity, createEntity, updateEntityImage, updateEntityProfile, getCascadedDNA]);

  const handleUnpinWorld = useCallback((worldId: string) => {
    togglePinned(worldId);
  }, [togglePinned]);

  return {
    pinnedWorldTrees,
    toggleExpanded,
    handleNodeClick,
    handleUnpinWorld,
    activeNodeId: activeEntity
  };
}
