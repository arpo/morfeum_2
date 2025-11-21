/**
 * Tree Navigation Utilities
 * Reusable functions for traversing and finding nodes in tree structures
 */

/**
 * Find the deepest node ID in a world tree hierarchy
 */
export function findDeepestNodeId(worldTree: any): string | null {
  if (!worldTree) return null;

  if (worldTree.regions && worldTree.regions.length > 0) {
    const region = worldTree.regions[0];
    if (region.locations && region.locations.length > 0) {
      const location = region.locations[0];
      if (location.niches && location.niches.length > 0) {
        return location.niches[0].id || location.niches[0].slug;
      }
      return location.id || location.slug;
    }
    return region.id || region.slug;
  }
  return worldTree.id || worldTree.slug;
}

/**
 * Get all ancestor IDs for a target node
 */
export function getAncestors(tree: any, targetId: string | null): string[] {
  if (!targetId || !tree) return [];

  const ancestors: string[] = [];

  const search = (node: any, path: string[]): boolean => {
    if (node.id === targetId || node.slug === targetId) {
      path.forEach(p => ancestors.push(p));
      return true;
    }

    const children = [
      ...(node.regions || []),
      ...(node.locations || []),
      ...(node.niches || [])
    ];

    for (const child of children) {
      if (search(child, [...path, node.id || node.slug])) {
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

  const children = [
    ...(tree.regions || []),
    ...(tree.locations || []),
    ...(tree.niches || [])
  ];

  for (const child of children) {
    const found = findNodeInTree(child, targetId);
    if (found) return found;
  }

  return null;
}
