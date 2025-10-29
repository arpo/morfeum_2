/**
 * Tree Utilities - Central location for all tree traversal and manipulation logic
 */

export interface TreeNode {
  id: string;
  type: string;
  children?: TreeNode[];
}

/**
 * Finds the tree that contains a specific node ID
 * @param trees Array of tree roots to search
 * @param targetId Node ID to find
 * @returns The tree containing the node, or undefined if not found
 */
export function findTreeContainingNode(
  trees: TreeNode[],
  targetId: string
): TreeNode | undefined {
  return trees.find(tree => findNodeInTree(tree, targetId) !== null);
}

/**
 * Recursively finds a node in a tree by ID
 * @param tree Tree to search
 * @param targetId Node ID to find
 * @returns The found node, or null if not found
 */
export function findNodeInTree(
  tree: TreeNode,
  targetId: string
): TreeNode | null {
  if (tree.id === targetId) return tree;
  
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeInTree(child, targetId);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Checks if a node exists in a tree
 * @param tree Tree to search
 * @param targetId Node ID to find
 * @returns True if node exists in tree
 */
export function nodeExistsInTree(
  tree: TreeNode,
  targetId: string
): boolean {
  return findNodeInTree(tree, targetId) !== null;
}

/**
 * Collects all node IDs in a tree (depth-first)
 * @param tree Tree to traverse
 * @returns Array of all node IDs in the tree
 */
export function collectAllNodeIds(tree: TreeNode): string[] {
  const ids: string[] = [];
  
  const traverse = (node: TreeNode) => {
    ids.push(node.id);
    node.children?.forEach(traverse);
  };
  
  traverse(tree);
  return ids;
}

/**
 * Traverses a tree and calls a callback for each node
 * @param tree Tree to traverse
 * @param callback Function to call for each node
 */
export function traverseTree(
  tree: TreeNode,
  callback: (node: TreeNode, depth: number) => void,
  depth: number = 0
): void {
  callback(tree, depth);
  tree.children?.forEach(child => traverseTree(child, callback, depth + 1));
}

/**
 * Gets the depth of a specific node in a tree
 * @param tree Tree to search
 * @param targetId Node ID to find depth for
 * @returns Depth of node (0 = root), or -1 if not found
 */
export function getNodeDepth(tree: TreeNode, targetId: string): number {
  let foundDepth = -1;
  
  traverseTree(tree, (node, depth) => {
    if (node.id === targetId) {
      foundDepth = depth;
    }
  });
  
  return foundDepth;
}

/**
 * Counts total number of nodes in a tree
 * @param tree Tree to count nodes in
 * @returns Total number of nodes
 */
export function countNodes(tree: TreeNode): number {
  let count = 1; // Count root
  tree.children?.forEach(child => {
    count += countNodes(child);
  });
  return count;
}

/**
 * Gets all ancestors of a node (from root to parent)
 * @param tree Tree to search
 * @param targetId Node ID to find ancestors for
 * @returns Array of ancestor nodes, or empty array if not found
 */
export function getAncestors(tree: TreeNode, targetId: string): TreeNode[] {
  const ancestors: TreeNode[] = [];
  
  function findPath(node: TreeNode, path: TreeNode[]): boolean {
    if (node.id === targetId) {
      ancestors.push(...path);
      return true;
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (findPath(child, [...path, node])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  findPath(tree, []);
  return ancestors;
}

/**
 * Finds the first image in a tree by traversing depth-first
 * Useful for finding a representative image for a location hierarchy
 * @param nodeId Root node ID to start search from
 * @param getNode Function to get a node by ID from store
 * @param worldTrees Array of all world trees
 * @returns First non-empty imagePath found, or empty string if none
 */
export function findFirstImageInTree(
  nodeId: string,
  getNode: (id: string) => { imagePath?: string } | undefined,
  worldTrees: TreeNode[]
): string {
  // Find tree containing this node
  const tree = findTreeContainingNode(worldTrees, nodeId);
  if (!tree) return '';
  
  // Traverse tree depth-first looking for first image
  const checkNode = (treeNode: TreeNode): string => {
    const node = getNode(treeNode.id);
    if (node?.imagePath) return node.imagePath;
    
    // Check children
    if (treeNode.children) {
      for (const child of treeNode.children) {
        const found = checkNode(child);
        if (found) return found;
      }
    }
    
    return '';
  };
  
  return checkNode(tree);
}
