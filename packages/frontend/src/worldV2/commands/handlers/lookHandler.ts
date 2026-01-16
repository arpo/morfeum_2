/**
 * LOOK Command Handler
 * 
 * Changes viewpoint within the same space by creating a view node.
 * Available on location, space, and view nodes.
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

export async function handleLookCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeNodeId?: string
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  if (!text || !text.trim()) {
    return validationError(
      callbacks,
      'Please provide a look instruction (e.g., /LOOK toward the fireplace)'
    );
  }

  if (!activeNodeId) {
    return validationError(
      callbacks,
      'Please select a location or space node first before using /LOOK'
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/look', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: activeNodeId,
        instruction: text.trim()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to change viewpoint');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/LOOK ${text}`,
        async (completedData: any) => {
          // Create entity session with image - displays image immediately
          if (completedData.view) {
            await reloadAndCreateSession(
              {
                id: completedData.view.id,
                name: completedData.view.name,
                type: completedData.view.type,
                primaryMedia: completedData.mediaId
              },
              completedData.imageUrl
            );
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to change viewpoint')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to change viewpoint');
  }
}
