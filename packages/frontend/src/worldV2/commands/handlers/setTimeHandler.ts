/**
 * SET_TIME Command Handler
 * 
 * Updates the timeOfDay on the active host node.
 */

import { useLocationsStore } from '@/store/slices/locations';
import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from '../types';
import { validationError, handleCommandError } from '../utils/commandUtils';

const VALID_TIME_OF_DAY = [
  'pre_dawn', 'dawn', 'morning', 'midday', 'afternoon',
  'golden_hour', 'sunset', 'dusk', 'night', 'midnight'
] as const;

type TimeOfDay = typeof VALID_TIME_OF_DAY[number];

/**
 * Find the host ID from any node (host, region, or location)
 */
function findHostId(nodeId: string, nodeType: string): string | null {
  const { worldTrees } = useLocationsStore.getState();
  
  if (nodeType === 'host') {
    return nodeId;
  }
  
  // Find the host that contains this node
  for (const hostTree of worldTrees) {
    if (nodeType === 'region') {
      const regionEntry = hostTree.children?.find((child: { id: string }) => child.id === nodeId);
      if (regionEntry) {
        return hostTree.id;
      }
    }
    
    if (nodeType === 'location') {
      for (const regionEntry of hostTree.children || []) {
        const locationEntry = regionEntry.children?.find((child: { id: string }) => child.id === nodeId);
        if (locationEntry) {
          return hostTree.id;
        }
      }
    }
  }
  
  return null;
}

export async function handleSetTimeCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setMovementInput } = callbacks;

  // Validate that we have an active node
  if (!activeEntityId) {
    return validationError(
      callbacks,
      'No node selected. Select a host, region, or location first.'
    );
  }

  if (!['host', 'region', 'location'].includes(activeEntityType || '')) {
    return validationError(
      callbacks,
      'SET_TIME can only be used when a host, region, or location is selected'
    );
  }

  // Get timeOfDay from text
  const timeOfDay = text?.trim().toLowerCase().replace(/\s+/g, '_') as TimeOfDay;
  
  if (!timeOfDay) {
    return validationError(
      callbacks,
      `Missing time of day. Usage: /SET_TIME <time>\nValid times: ${VALID_TIME_OF_DAY.join(', ')}`
    );
  }

  if (!VALID_TIME_OF_DAY.includes(timeOfDay)) {
    return validationError(
      callbacks,
      `Invalid time of day: "${timeOfDay}"\nValid times: ${VALID_TIME_OF_DAY.join(', ')}`
    );
  }

  // Find the host ID
  const hostId = findHostId(activeEntityId, activeEntityType || '');
  if (!hostId) {
    return validationError(
      callbacks,
      'Could not find parent host for this node'
    );
  }

  try {
    const response = await fetch('/api/v2/set-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId, timeOfDay })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to set time');
    }

    // Reload locations store to reflect changes
    await useLocationsStore.getState().loadFromBackend();

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to set time');
  }
}
