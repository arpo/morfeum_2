/**
 * NEW_WORLD_LOCATION Command Handler
 * 
 * Creates a complete world hierarchy (Host + Region + Location) with image
 * from a single concept.
 */

import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from '../types';
import {
  validationError,
  handleCommandError,
  registerSpawn,
  reloadAndSetActive,
  createErrorHandler
} from '../utils/commandUtils';

export async function handleNewWorldLocationCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  if (!text || !text.trim()) {
    return validationError(
      callbacks,
      'Please provide a world concept (e.g., /NEW_WORLD_LOCATION a pub in Camden in London)'
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/new-world-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: text.trim() })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to create world');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/NEW_WORLD_LOCATION ${text}`,
        async (completedData: any) => {
          // Set the location as active (deepest node with image)
          if (completedData.location) {
            await reloadAndSetActive(completedData.location.id);
          } else if (completedData.host) {
            // Fallback to host if location not found
            await reloadAndSetActive(completedData.host.id);
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to create world')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to create world');
  }
}
