/**
 * EDIT_IMAGE Command Handler (V2)
 * 
 * Edits existing node image with a text prompt.
 * Supports all node types: host, region, location, niche, container, space, view
 */

import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { clearEntityMediaCache } from '@/services/mediaService';
import { createEntitySession } from '@/utils/entity/sessionManager';
import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from '../types';
import {
  validationError,
  handleCommandError,
  registerSpawn,
  createErrorHandler
} from '../utils/commandUtils';

export async function handleEditImageCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  // Validate that we have a node selected
  if (!activeEntityId) {
    return validationError(
      callbacks,
      'No node selected. Select a node with an image first.'
    );
  }

  // Validate that we have a prompt
  if (!text || text.trim().length === 0) {
    return validationError(
      callbacks,
      'Please provide an edit prompt. Example: /EDIT_IMAGE change to winter scene'
    );
  }

  // EDIT_IMAGE can be used on any node type (all supported)
  const supportedTypes = ['host', 'region', 'location', 'niche', 'container', 'space', 'view'];
  if (!supportedTypes.includes(activeEntityType || '')) {
    return validationError(
      callbacks,
      `EDIT_IMAGE cannot be used on ${activeEntityType} nodes`
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: activeEntityId,
        prompt: text.trim()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to edit image');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/EDIT_IMAGE ${text.trim()}`,
        async (completedData: any) => {
          if (completedData.imageUrl) {
            // Clear media cache for this entity
            clearEntityMediaCache(activeEntityId!);

            // Reload locations store from backend to get the updated node data
            await useLocationsStore.getState().loadFromBackend();

            // Update entity session with new image
            createEntitySession(useStore.getState(), {
              id: activeEntityId!,
              name: completedData.node?.name || 'Unknown',
              type: activeEntityType as any || 'location',
              primaryMedia: completedData.mediaId,
              imageUrl: completedData.imageUrl
            });
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to edit image')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to edit image');
  }
}
