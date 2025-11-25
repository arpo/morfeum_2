/**
 * Completion Handlers
 * Unified completion logic for different entity types
 */

import { useLocationsStore } from '../../store/slices/locations';
import { useCharactersStore } from '../../store/slices/charactersSlice';

import { findDeepestNodeId } from '../tree/navigation';
import { createEntitySession } from '../entity/sessionManager';
import { expandTreeToNode } from '../tree/expansion';

/**
 * Handle character completion
 */
export async function handleCharacterCompletion(
  spawnId: string,
  character: any,
  store: any
) {
  console.log(`[CompletionHandler] Handling character: ${character.name}`);

  // Reload from backend to sync pinnedIds
  await useCharactersStore.getState().loadFromBackend();

  // Create entity session and set active
  createEntitySession(store, {
    id: character.id,
    name: character.name,
    type: 'character',
    personality: character.details.personality || '',
    imagePath: character.imagePath,
    imagePrompt: character.details.imagePrompt
  });

  console.log(`[CompletionHandler] Character ${character.name} session created and active`);
}

/**
 * Handle location/world tree completion
 */
export function handleLocationCompletion(
  spawnId: string,
  worldTree: any,
  store: any
) {
  console.log(`[CompletionHandler] Handling location: ${worldTree.name}`);

  // Pin the world and update Locations Store
  useLocationsStore.getState().setCompleteWorldTree(worldTree);

  // Find deepest node and expand tree
  const deepId = findDeepestNodeId(worldTree);
  if (deepId) {
    expandTreeToNode(worldTree, deepId, 'entity-explorer-locations');

    // Get node data
    const locationsState = useLocationsStore.getState();
    const node = locationsState.nodes[deepId];

    if (node) {
      // Create entity session
      createEntitySession(store, {
        id: deepId,
        name: node.name || 'New Location',
        type: 'location',
        atmosphere: 'Generated',
        imagePath: node.imagePath
      });

      console.log(`[CompletionHandler] Location ${node.name} session created and active`);
    }
  }
}

/**
 * Handle navigation completion (niche creation)
 * Note: Navigation spawns use custom callbacks in useLocationPanel.ts
 * This handler is a no-op since the callback handles node creation
 */
export function handleNavigationCompletion(
  spawnId: string,
  completionData: any,
  store: any
) {
  // Navigation completions are handled by custom callbacks in useLocationPanel
  // This is intentionally a no-op to avoid duplicate handling
}

/**
 * Unified completion dispatcher
 */
export function handleSpawnCompletion(
  spawnId: string,
  completionData: any,
  store: any
) {
  // Determine completion type
  if (completionData.character) {
    return handleCharacterCompletion(spawnId, completionData.character, store);
  } else if (completionData.worldTree) {
    return handleLocationCompletion(spawnId, completionData.worldTree, store);
  } else if (completionData.node || (completionData.imageUrl && completionData.imagePrompt)) {
    // Navigation/niche spawns - handled by custom callback
    // Check for node property OR imageUrl+imagePrompt combo (navigation pipeline signature)
    return handleNavigationCompletion(spawnId, completionData, store);
  }

  console.warn('[CompletionHandler] Unknown completion type:', completionData);
}
