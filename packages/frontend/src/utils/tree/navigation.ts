/**
 * Tree Navigation Utilities
 * Reusable functions for traversing and finding nodes in tree structures
 * Supports both formats:
 * - New format: { id, children: [...] }
 * - Legacy format: { regions: [...], locations: [...], niches: [...] }
 */

/**
 * Get children from a node (supports both new and legacy formats)
 */
function getNodeChildren(node: any): any[] {
  if (!node) return [];
  
  // New format: unified children array
  if (node.children && Array.isArray(node.children)) {
    return node.children;
  }
  
  // Legacy format: separate arrays by type
  return [
    ...(node.regions || []),
    ...(node.locations || []),
    ...(node.niches || [])
  ];
}

/**
 * Find the deepest node ID in a world tree hierarchy
 * Traverses down the first child branch to find the deepest node
 */
export function findDeepestNodeId(worldTree: any): string | null {
  if (!worldTree) return null;

  const children = getNodeChildren(worldTree);
  
  // If has children, recurse into first child
  if (children.length > 0) {
    return findDeepestNodeId(children[0]);
  }
  
  // No children, this is the deepest node
  return worldTree.id || worldTree.slug || null;
}

/**
 * Find the deepest node (full object) in a tree hierarchy
 * Returns { id, name } of the deepest node
 */
export function findDeepestNode(tree: any): { id: string; name: string } | null {
  if (!tree) return null;

  const children = getNodeChildren(tree);
  
  // If has children, recurse into first child
  if (children.length > 0) {
    return findDeepestNode(children[0]);
  }
  
  // No children, this is the deepest node
  return {
    id: tree.id || tree.slug,
    name: tree.name || 'Unknown'
  };
}

/**
 * Find the parent ID of a node within world trees
 */
export function findParentId(worldTrees: any[], nodeId: string): string | null {
  for (const tree of worldTrees) {
    const result = findParentInTreeHelper(tree, nodeId, null);
    if (result !== undefined) return result;
  }
  return null;
}

/**
 * Helper: Recursively search for parent in tree
 */
function findParentInTreeHelper(
  node: any, 
  targetId: string, 
  parentId: string | null
): string | null | undefined {
  const nodeId = node.id || node.slug;
  if (nodeId === targetId) return parentId;
  
  const children = getNodeChildren(node);
  for (const child of children) {
    const result = findParentInTreeHelper(child, targetId, nodeId);
    if (result !== undefined) return result;
  }
  return undefined;
}

/**
 * Get all ancestor IDs for a target node (not including the target itself)
 */
export function getAncestors(tree: any, targetId: string | null): string[] {
  if (!targetId || !tree) return [];

  const ancestors: string[] = [];

  const search = (node: any, path: string[]): boolean => {
    const nodeId = node.id || node.slug;
    
    if (nodeId === targetId) {
      // Found target - add all ancestors from path
      path.forEach(p => ancestors.push(p));
      return true;
    }

    const children = getNodeChildren(node);

    for (const child of children) {
      if (search(child, [...path, nodeId])) {
        return true;
      }
    }

    return false;
  };

  search(tree, []);
  return ancestors;
}

/**
 * Find a node by ID in a tree structure
 */
export function findNodeInTree(tree: any, targetId: string): any {
  if (tree.id === targetId || tree.slug === targetId) return tree;

  const children = getNodeChildren(tree);

  for (const child of children) {
    const found = findNodeInTree(child, targetId);
    if (found) return found;
  }

  return null;
}
