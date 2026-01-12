/**
 * NEW_REGION2 Command Handler
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

export async function handleNewRegionCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  // Validate that we're on a host node
  if (activeEntityType !== 'host') {
    return validationError(
      callbacks,
      'NEW_REGION2 can only be used when focused on a host node'
    );
  }

  if (!activeEntityId) {
    return validationError(
      callbacks,
      'No host selected. Create or select a host first.'
    );
  }

  if (!text || !text.trim()) {
    return validationError(
      callbacks,
      'Please provide a region concept (e.g., /NEW_REGION2 The industrial docks)'
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/new-region', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept: text.trim(),
        hostId: activeEntityId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to create region');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/NEW_REGION2 ${text}`,
        async (completedData: any) => {
          if (completedData.region) {
            await reloadAndSetActive(completedData.region.id);
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to create region')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to create region');
  }
}
