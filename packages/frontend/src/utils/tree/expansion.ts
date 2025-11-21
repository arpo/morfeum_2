/**
 * Tree Expansion Utilities
 * Handle tree node expansion in TreeView components
 */

import { getAncestors } from './navigation';
import { useLocationsStore } from '../../store/slices/locations';

/**
 * Expand tree to show a specific node
 * Updates store state to trigger tree re-render
 */
export function expandTreeToNode(
  tree: any,
  targetNodeId: string,
  persistenceKey?: string
): void {
  try {
    // Get all ancestor IDs that need to be expanded
    const ancestors = getAncestors(tree, targetNodeId);

    // Update store with all ancestors
    const locationsStore = useLocationsStore.getState();
    const currentExpanded = locationsStore.expandedNodeIds || [];
    const newExpanded = [...new Set([...currentExpanded, ...ancestors])];
    locationsStore.setExpandedNodes(newExpanded);

    // Also update localStorage for persistence (optional, for backward compatibility)
    if (persistenceKey) {
      try {
        localStorage.setItem(persistenceKey, JSON.stringify(newExpanded));
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
    }

    console.log(`[TreeExpansion] Expanded tree to node: ${targetNodeId}`);
  } catch (e) {
    console.error('[TreeExpansion] Failed to update tree expansion', e);
  }
}

/**
 * Collapse all nodes in tree
 */
export function collapseTree(persistenceKey?: string): void {
  try {
    // Update store
    const locationsStore = useLocationsStore.getState();
    locationsStore.setExpandedNodes([]);

    // Also update localStorage for persistence (optional)
    if (persistenceKey) {
      localStorage.setItem(persistenceKey, JSON.stringify([]));
    }
    console.log(`[TreeExpansion] Collapsed tree`);
  } catch (e) {
    console.error('[TreeExpansion] Failed to collapse tree', e);
  }
}

/**
 * Get expanded node IDs from store
 */
export function getExpandedNodes(): string[] {
  try {
    const locationsStore = useLocationsStore.getState();
    return locationsStore.expandedNodeIds || [];
  } catch (e) {
    console.error('[TreeExpansion] Failed to get expanded nodes:', e);
    return [];
  }
}
