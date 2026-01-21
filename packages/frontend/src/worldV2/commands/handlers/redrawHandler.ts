/**
 * REDRAW Command Handler (Frontend)
 * 
 * Thin wrapper that passes nodeId and optional trailingCommand to backend.
 * Backend handles all logic: finding host, building prompt, generating image.
 */

import { clearEntityMediaCache } from '@/services/mediaService';
import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from '../types';
import {
  validationError,
  handleCommandError,
  registerSpawn,
  reloadAndCreateSession,
  createErrorHandler
} from '../utils/commandUtils';

export async function handleRedrawCommand(
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

  // REDRAW can be used on any node type with an image
  const supportedTypes = ['host', 'region', 'location', 'niche', 'container', 'space', 'view'];
  if (!supportedTypes.includes(activeEntityType || '')) {
    return validationError(
      callbacks,
      `REDRAW cannot be used on ${activeEntityType} nodes`
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/redraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: activeEntityId,
        trailingCommand: text?.trim() || undefined
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to redraw');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/REDRAW${text ? ' ' + text.trim() : ''}`,
        async (completedData: any) => {
          if (completedData.imageUrl && completedData.view) {
            // Clear media cache for parent entity
            clearEntityMediaCache(activeEntityId!);

            // Create session for the new VIEW node
            await reloadAndCreateSession(
              {
                id: completedData.view.id,
                name: completedData.view.name,
                type: completedData.view.type,
                primaryMedia: completedData.view.primaryMedia
              },
              completedData.imageUrl,
              completedData.modelClass
            );
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to redraw scene')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to redraw scene');
  }
}
