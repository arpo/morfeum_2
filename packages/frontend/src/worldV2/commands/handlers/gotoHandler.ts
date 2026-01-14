/**
 * GOTO2 Command Handler
 * 
 * Creates a sibling space within the same container.
 * Only available when standing on a space node.
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

export async function handleGotoCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeNodeId?: string
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  if (!text || !text.trim()) {
    return validationError(
      callbacks,
      'Please provide a target (e.g., /GOTO2 the VIP lounge)'
    );
  }

  if (!activeNodeId) {
    return validationError(
      callbacks,
      'Please select a space node first before using /GOTO2'
    );
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/goto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: activeNodeId,
        target: text.trim()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to create sibling space');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/GOTO2 ${text}`,
        async (completedData: any) => {
          // Set the new space node as active (it has the image)
          if (completedData.space) {
            await reloadAndSetActive(completedData.space.id);
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed to create sibling space')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to create sibling space');
  }
}
