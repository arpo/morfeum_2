/**
 * Completion Handlers
 * Unified completion logic for different entity types
 */

import { useLocationsStore } from '../../store/slices/locations';
import { useCharactersStore } from '../../store/slices/charactersSlice';

import { findDeepestNodeId, findDeepestNode } from '../tree/navigation';
import { createEntitySession } from '../entity/sessionManager';
import { expandTreeToNode } from '../tree/expansion';

/**
 * Handle character completion
 */
export async function handleCharacterCompletion(
  _spawnId: string,
  character: any,
  store: any
) {
  // Reload from backend to sync pinnedIds
  await useCharactersStore.getState().loadFromBackend();

  // Create entity session and set active
  // Pass imageUrl from completion data to add to cache
  createEntitySession(store, {
    id: character.id,
    name: character.name,
    type: 'character',
    personality: character.details.personality || '',
    imagePrompt: character.details.imagePrompt,
    primaryMedia: character.primaryMedia,
    imageUrl: character.imageUrl  // From pipeline completion
  });
}

/**
 * Handle location/world tree completion
 */
export function handleLocationCompletion(
  _spawnId: string,
  worldTree: any,
  store: any,
  imageUrl?: string  // Now passed from top-level completion data
) {
  // Extract deepest node data from worldTree BEFORE store processing
  const deepestNodeData = findDeepestNode(worldTree);

  // Pin the world and update Locations Store
  useLocationsStore.getState().setCompleteWorldTree(worldTree);

  // Find deepest node and expand tree
  const deepId = findDeepestNodeId(worldTree);
  if (deepId) {
    expandTreeToNode(worldTree, deepId, 'entity-explorer-locations');

    // Get node data from store for name (store has processed data)
    const locationsState = useLocationsStore.getState();
    const node = locationsState.nodes[deepId];

    if (node || deepestNodeData) {
      // Create entity session
      // Pass imageUrl from completion data to add to cache
      createEntitySession(store, {
        id: deepId,
        name: node?.name || deepestNodeData?.name || 'New Location',
        type: 'location',
        atmosphere: 'Generated',
        primaryMedia: node?.primaryMedia,
        imageUrl  // From pipeline completion (top-level)
      });
    }
  }
}

/**
 * Handle V2 world location completion (NEW_WORLD_LOCATION)
 * Creates a new world with host + region + location structure
 */
export async function handleV2WorldLocationCompletion(
  _spawnId: string,
  completionData: any,
  store: any
) {
  const { location, imageUrl } = completionData;
  
  if (!location?.id) {
    console.warn('[CompletionHandler] V2 World Location completion missing location data');
    return;
  }

  // Reload from backend to sync the new world tree
  await useLocationsStore.getState().loadFromBackend();

  // Expand tree to the new location
  const locationsState = useLocationsStore.getState();
  const worldTrees = locationsState.worldTrees;
  
  // Find the world tree containing this location
  for (const tree of worldTrees) {
    expandTreeToNode(tree, location.id, 'entity-explorer-locations');
  }

  // Create entity session for the new location
  createEntitySession(store, {
    id: location.id,
    name: location.name || 'New Location',
    type: 'location',
    atmosphere: 'Generated',
    primaryMedia: location.primaryMedia,
    imageUrl
  });
}

/**
 * Handle navigation completion (niche creation)
 * Note: Navigation spawns use custom callbacks in useLocationPanel.ts
 * This handler is a no-op since the callback handles node creation
 */
export function handleNavigationCompletion(
  _spawnId: string,
  _completionData: any,
  _store: any
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
    // Pass imageUrl from top-level completion data
    return handleLocationCompletion(spawnId, completionData.worldTree, store, completionData.imageUrl);
  } else if (completionData.node || (completionData.imageUrl && completionData.imagePrompt)) {
    // Navigation/niche spawns - handled by custom callback
    // Check for node property OR imageUrl+imagePrompt combo (navigation pipeline signature)
    return handleNavigationCompletion(spawnId, completionData, store);
  } else if (completionData.space || completionData.container) {
    // GO_INSIDE spawns (space + container format) - handled by custom callback
    return handleNavigationCompletion(spawnId, completionData, store);
  } else if (completionData.view) {
    // LOOK spawns (view format) - handled by custom callback
    return handleNavigationCompletion(spawnId, completionData, store);
  } else if (completionData.host && completionData.region && completionData.location) {
    // V2 NEW_WORLD_LOCATION spawns (host + region + location format)
    return handleV2WorldLocationCompletion(spawnId, completionData, store);
  }

  console.warn('[CompletionHandler] Unknown completion type:', completionData);
}
