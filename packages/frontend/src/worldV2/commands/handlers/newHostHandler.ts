/**
 * NEW_HOST Command Handler
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

export async function handleNewHostCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  if (!text || !text.trim()) {
    return validationError(
      callbacks,
      'Please provide a world concept (e.g., /NEW_HOST A steampunk metropolis)'
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/new-host', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: text.trim() })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to create host');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/NEW_HOST ${text}`,
        async (completedData: any) => {
          if (completedData.host) {
            await reloadAndSetActive(completedData.host.id);
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to create host')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to create host');
  }
}
