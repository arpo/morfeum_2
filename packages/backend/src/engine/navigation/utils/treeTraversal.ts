/**
 * Tree Traversal Utilities
 * Functions for traversing and manipulating world tree structures
 */

/**
 * World tree node structure for traversal
 */
interface WorldTreeNode {
  id: string;
  type: string;
  children?: WorldTreeNode[];
}

/**
 * Find the host node for a given region ID by traversing worldTrees
 * Used for pass-through regions to get DNA from the host
 * 
 * @param regionId - The region node ID to find the host for
 * @param worldTrees - Array of world tree structures
 * @param nodes - Map of all nodes by ID
 * @returns The host node with DNA, or null if not found
 */
export function findHostForRegion(
  regionId: string, 
  worldTrees: WorldTreeNode[], 
  nodes: Record<string, any>
): any | null {
  for (const tree of worldTrees) {
    // Check if this tree's host has the region as a child
    if (tree.children) {
      for (const child of tree.children) {
        if (child.id === regionId) {
          // Found the region, return the host node
          return nodes[tree.id];
        }
      }
    }
  }
  return null;
}

/**
 * Add a child entry to a world tree under a specific parent
 * Traverses recursively to find the target parent node
 * 
 * @param tree - The world tree array to modify
 * @param targetId - The parent node ID to add the child under
 * @param childEntry - The child entry to add { id, type, children: [] }
 * @returns true if child was added, false if parent not found
 */
export function addChildToWorldTree(
  tree: WorldTreeNode[], 
  targetId: string, 
  childEntry: WorldTreeNode
): boolean {
  for (const node of tree) {
    if (node.id === targetId) {
      if (!node.children) node.children = [];
      node.children.push(childEntry);
      return true;
    }
    if (node.children && addChildToWorldTree(node.children, targetId, childEntry)) {
      return true;
    }
  }
  return false;
}
