/**
 * NEW_LOCATION2 Command Handler
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

export async function handleNewLocationCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  // Validate that we're on a region node
  if (activeEntityType !== 'region') {
    return validationError(
      callbacks,
      'NEW_LOCATION2 can only be used when focused on a region node'
    );
  }

  if (!activeEntityId) {
    return validationError(
      callbacks,
      'No region selected. Create or select a region first.'
    );
  }

  if (!text || !text.trim()) {
    return validationError(
      callbacks,
      'Please provide a location concept (e.g., /NEW_LOCATION2 The old cathedral)'
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/new-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept: text.trim(),
        regionId: activeEntityId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to create location');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/NEW_LOCATION2 ${text}`,
        async (completedData: any) => {
          if (completedData.location) {
            await reloadAndSetActive(completedData.location.id);
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to create location')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to create location');
  }
}
