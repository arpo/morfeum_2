/**
 * Tree Deletion Operations
 * Handles deleteWorldTree and deleteNodeWithChildren with media cleanup
 */

import { TreeNode, NodeType } from './types';
import { deleteMediaByIds } from '@/services/mediaService';

export interface TreeDeletionState {
  nodes: Record<string, any>;
  worldTrees: TreeNode[];
  pinnedIds: string[];
}

export interface TreeDeletionResult {
  nodes: Record<string, any>;
  worldTrees: TreeNode[];
  pinnedIds: string[];
}

/**
 * Collect all node IDs and their media IDs from a tree structure
 */
function collectNodeAndMediaIds(
  treeNode: TreeNode,
  nodes: Record<string, any>,
  nodeIdsToDelete: Set<string>,
  mediaIdsToDelete: Set<string>
): void {
  nodeIdsToDelete.add(treeNode.id);
  
  // Get the node from flat map and collect its primaryMedia ID
  const node = nodes[treeNode.id];
  if (node?.primaryMedia) {
    mediaIdsToDelete.add(node.primaryMedia);
  }
  
  treeNode.children?.forEach(child => 
    collectNodeAndMediaIds(child, nodes, nodeIdsToDelete, mediaIdsToDelete)
  );
}

/**
 * Find orphaned nodes (nodes in flat map but not in any tree)
 */
function findOrphanedNodes(
  nodes: Record<string, any>,
  worldTrees: TreeNode[]
): Set<string> {
  const allTreeNodeIds = new Set<string>();
  
  worldTrees.forEach((tree: TreeNode) => {
    const collectAll = (node: TreeNode) => {
      allTreeNodeIds.add(node.id);
      node.children?.forEach(child => collectAll(child));
    };
    collectAll(tree);
  });
  
  const orphanedIds = new Set<string>();
  Object.keys(nodes).forEach(nodeId => {
    if (!allTreeNodeIds.has(nodeId)) {
      orphanedIds.add(nodeId);
    }
  });
  
  return orphanedIds;
}

/**
 * Delete an entire world tree and all its nodes/media
 */
export function deleteWorldTree(
  worldId: string,
  state: TreeDeletionState
): TreeDeletionResult {
  const { nodes, worldTrees, pinnedIds } = state;
  
  // Find the world tree
  const treeIndex = worldTrees.findIndex((t: TreeNode) => t.id === worldId);
  if (treeIndex === -1) {
    console.warn('[treeDeletion] World tree not found:', worldId);
    return state;
  }
  
  // Collect node IDs and their media IDs
  const nodeIdsToDelete = new Set<string>();
  const mediaIdsToDelete = new Set<string>();
  
  collectNodeAndMediaIds(worldTrees[treeIndex], nodes, nodeIdsToDelete, mediaIdsToDelete);
  
  // Also check for orphaned nodes
  const orphanedIds = findOrphanedNodes(nodes, worldTrees);
  orphanedIds.forEach(nodeId => {
    nodeIdsToDelete.add(nodeId);
    const node = nodes[nodeId];
    if (node?.primaryMedia) {
      mediaIdsToDelete.add(node.primaryMedia);
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
  
  return {
    nodes: newNodes,
    worldTrees: newTrees,
    pinnedIds: newPinnedIds
  };
}

/**
 * Find a node in a tree and return its subtree
 */
function findNodeSubtree(tree: TreeNode, nodeId: string): TreeNode | null {
  if (tree.id === nodeId) return tree;
  for (const child of tree.children) {
    const found = findNodeSubtree(child, nodeId);
    if (found) return found;
  }
  return null;
}

/**
 * Deep clone a tree and remove a specific node
 */
function cloneTreeWithoutNode(node: TreeNode, nodeIdToRemove: string): TreeNode {
  return {
    ...node,
    children: node.children
      .filter(child => child.id !== nodeIdToRemove)
      .map(child => cloneTreeWithoutNode(child, nodeIdToRemove))
  };
}

/**
 * Delete a node and all its children from the tree
 */
export function deleteNodeWithChildren(
  nodeId: string,
  state: TreeDeletionState
): TreeDeletionResult {
  const { nodes, worldTrees, pinnedIds } = state;
  
  // Find which world tree contains this node
  let targetWorldId: string | null = null;
  let targetSubtree: TreeNode | null = null;
  
  for (const tree of worldTrees) {
    targetSubtree = findNodeSubtree(tree, nodeId);
    if (targetSubtree) {
      targetWorldId = tree.id;
      break;
    }
  }
  
  if (!targetSubtree || !targetWorldId) {
    console.warn('[treeDeletion] Node not found in any tree:', nodeId);
    return state;
  }
  
  // Collect node IDs and their media IDs
  const nodeIdsToDelete = new Set<string>();
  const mediaIdsToDelete = new Set<string>();
  
  collectNodeAndMediaIds(targetSubtree, nodes, nodeIdsToDelete, mediaIdsToDelete);
  
  // Delete all nodes from nodes map
  const newNodes = { ...nodes };
  nodeIdsToDelete.forEach(id => delete newNodes[id]);
  
  // Remove the subtree from parent in the tree structure
  // Special case: if nodeId is the root of a world tree, remove the entire tree
  let newTrees: TreeNode[];
  const isRootNode = worldTrees.some(tree => tree.id === nodeId);
  
  if (isRootNode) {
    // Filter out the entire tree when deleting a root node
    newTrees = worldTrees.filter(tree => tree.id !== nodeId);
  } else {
    // Remove node from within the tree structure
    newTrees = worldTrees.map((tree: TreeNode) => {
      if (tree.id !== targetWorldId) return tree;
      return cloneTreeWithoutNode(tree, nodeId);
    });
  }
  
  // Clean up pins
  const newPinnedIds = pinnedIds.filter((id: string) => !nodeIdsToDelete.has(id));
  
  // Delete media by media IDs
  if (mediaIdsToDelete.size > 0) {
    deleteMediaByIds(Array.from(mediaIdsToDelete));
  }
  
  return {
    nodes: newNodes,
    worldTrees: newTrees,
    pinnedIds: newPinnedIds
  };
}
