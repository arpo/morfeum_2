/**
 * Tree Traversal Utilities
 * Pure functions for traversing and manipulating tree structures
 */

import { TreeNode } from './types';

/**
 * Find a node in a tree by ID (recursive search)
 */
export const findNodeInTreeRecursive = (tree: TreeNode, targetId: string): TreeNode | null => {
  if (tree.id === targetId) return tree;
  
  for (const child of tree.children) {
    const found = findNodeInTreeRecursive(child, targetId);
    if (found) return found;
  }
  
  return null;
};

/**
 * Get all ancestor IDs from root to target node
 */
export const getAncestorsRecursive = (
  tree: TreeNode, 
  targetId: string, 
  path: string[] = []
): string[] | null => {
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

/**
 * Remove a node from a tree by ID (mutates the tree)
 * Returns true if node was found and removed
 */
export const removeNodeFromTreeRecursive = (tree: TreeNode, targetId: string): boolean => {
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

/**
 * Extract only tree structure (id, type, children) from a node with full data
 * Strips out all other properties
 */
export const extractTreeStructure = (node: any): TreeNode => {
  return {
    id: node.id,
    type: node.type,
    children: node.children?.map((child: any) => extractTreeStructure(child)) || []
  };
};
