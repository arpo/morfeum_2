/**
 * Creation Commands (V1 - DEPRECATED)
 * 
 * V1 creation commands (NEW_WORLD, NEW_REGION, NEW_LOCATION) have been removed.
 * Use V2 commands instead:
 * - NEW_WORLD_LOCATION (creates full hierarchy)
 * - NEW_REGION2
 * - NEW_LOCATION2
 * 
 * This file now only contains helper functions for node creation from navigation.
 */

import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { createEntitySession } from '@/utils/entity/sessionManager';
import type { ParsedCommand } from './commandParser';

interface CreationResult {
  success: boolean;
  error?: string;
}

interface CreationCallbacks {
  setIsMoving: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setMovementInput: (value: string) => void;
}

/**
 * Handle creation commands (V1 - DEPRECATED)
 * @deprecated V1 creation commands removed. This function always returns error.
 */
export async function handleCreationCommand(
  _parsedCommand: ParsedCommand,
  _currentNode: any | undefined,
  callbacks: CreationCallbacks
): Promise<CreationResult> {
  const { setErrorMessage, setIsMoving, setMovementInput } = callbacks;
  
  setErrorMessage('V1 creation commands removed. Use NEW_WORLD_LOCATION, NEW_REGION2, or NEW_LOCATION2');
  setTimeout(() => setErrorMessage(null), 5000);
  setIsMoving(false);
  setMovementInput('');
  
  return { success: false, error: 'V1 commands deprecated' };
}

/**
 * Handle node creation from navigation (GO_INSIDE creating a niche)
 * Also handles pass-through locations that need to be added to the store
 */
export async function handleNodeCreation(
  navigation: { 
    node: any; 
    parentNodeId?: string; 
    imageUrl?: string;
    passThroughLocation?: { node: any; parentId: string };  // Pass-through location from GO_INSIDE
    nicheParentId?: string;  // The correct parent ID for the niche (from completion event)
  },
  currentNode: any
): Promise<void> {
  const { node, parentNodeId, imageUrl, passThroughLocation, nicheParentId } = navigation;
  
  const createNodeInStore = useLocationsStore.getState().createNode;
  const addNodeToTree = useLocationsStore.getState().addNodeToTree;
  
  const currentWorldTrees = useLocationsStore.getState().worldTrees;
  const worldTree = currentWorldTrees.find(tree => {
    const findInTree = (treeNode: any, targetId: string): boolean => {
      if (treeNode.id === targetId) return true;
      return treeNode.children?.some((child: any) => findInTree(child, targetId)) || false;
    };
    return findInTree(tree, currentNode.id);
  });
  
  if (!worldTree) {
    console.error('[handleNodeCreation] Cannot find world tree for current node');
    return;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PASS-THROUGH LOCATION: Add to store first if present
  // This ensures proper hierarchy: niche → pass-through location → interior niche
  // ═══════════════════════════════════════════════════════════════════════════
  let worldTreeId = worldTree.id;
  
  if (passThroughLocation) {
    console.log(`[handleNodeCreation] Adding pass-through location: ${passThroughLocation.node.id}`);
    createNodeInStore(passThroughLocation.node);
    addNodeToTree(worldTreeId, passThroughLocation.parentId, passThroughLocation.node.id, 'location');
    
    // IMPORTANT: Re-fetch addNodeToTree after adding pass-through location
    // The tree state was updated, so we need a fresh reference for the next operation
    // The worldTreeId stays the same, but the tree structure has changed
  }
  
  // Add the main node to store
  createNodeInStore(node);
  
  // Determine correct parent:
  // 1. Use nicheParentId from completion event (pass-through location ID) if present
  // 2. Fall back to parentNodeId (stale - captured before pass-through was created)
  // 3. Fall back to current node ID
  const correctParentId = nicheParentId || parentNodeId || currentNode.id;
  
  if (nicheParentId) {
    console.log(`[handleNodeCreation] Using nicheParentId from completion event: ${nicheParentId}`);
  }
  
  // Get fresh addNodeToTree reference to ensure we're working with updated tree state
  const addNodeToTreeFresh = useLocationsStore.getState().addNodeToTree;
  addNodeToTreeFresh(worldTreeId, correctParentId, node.id, node.type);
  
  const saveToBackend = useLocationsStore.getState().saveToBackend;
  await saveToBackend();
  
  // Create entity session with image
  createEntitySession(useStore.getState(), {
    id: node.id,
    name: node.name,
    type: 'location',
    primaryMedia: node.primaryMedia,
    imageUrl
  });
}
