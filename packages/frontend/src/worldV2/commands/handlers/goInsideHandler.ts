/**
 * GO_INSIDE2 Command Handler
 * 
 * Navigates into a space using image edit with style lock.
 * Creates container + space nodes and generates an edited image.
 */

import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from '../types';
import {
  validationError,
  handleCommandError,
  registerSpawn,
  reloadAndCreateSession,
  createErrorHandler
} from '../utils/commandUtils';

export async function handleGoInsideCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeNodeId?: string
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  if (!text || !text.trim()) {
    return validationError(
      callbacks,
      'Please provide a target (e.g., /GO_INSIDE2 the restaurant)'
    );
  }

  if (!activeNodeId) {
    return validationError(
      callbacks,
      'Please select a location first before using /GO_INSIDE2'
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/go-inside', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: activeNodeId,
        target: text.trim()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to enter space');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/GO_INSIDE2 ${text}`,
        async (completedData: any) => {
          // Create entity session with image - displays image immediately
          if (completedData.space) {
            await reloadAndCreateSession(
              {
                id: completedData.space.id,
                name: completedData.space.name,
                type: completedData.space.type,
                primaryMedia: completedData.mediaId
              },
              completedData.imageUrl
            );
          } else if (completedData.container) {
            // Fallback to container if space not found
            await reloadAndCreateSession(
              {
                id: completedData.container.id,
                name: completedData.container.name,
                type: completedData.container.type,
                primaryMedia: completedData.mediaId
              },
              completedData.imageUrl
            );
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to enter space')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to enter space');
  }
}
