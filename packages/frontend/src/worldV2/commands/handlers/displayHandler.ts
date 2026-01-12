/**
 * DISPLAY Command Handler
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

export async function handleDisplayCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { flags } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  // Validate that we're on a V2 node
  if (!activeEntityId) {
    return validationError(
      callbacks,
      'No node selected. Select a host, region, or location first.'
    );
  }

  if (!['host', 'region', 'location'].includes(activeEntityType || '')) {
    return validationError(
      callbacks,
      'DISPLAY can only be used on host, region, or location nodes'
    );
  }

  // Check for --populate flag in passthroughFlags
  const populate = flags?.passthroughFlags?.includes('--populate') || false;

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/display', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: activeEntityId,
        populate
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to generate image');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/DISPLAY${populate ? ' --populate' : ''}`,
        async (completedData: any) => {
          if (completedData.imageUrl) {
            // Clear media cache for this entity
            clearEntityMediaCache(activeEntityId!);

            // Reload locations store from backend to get the updated node data
            await useLocationsStore.getState().loadFromBackend();

            // Update entity session with new image (same pattern as /VIEW command)
            createEntitySession(useStore.getState(), {
              id: activeEntityId!,
              name: completedData.node?.name || 'Unknown',
              type: 'location',
              primaryMedia: completedData.mediaId,
              imageUrl: completedData.imageUrl
            });
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to generate image')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to generate image');
  }
}
