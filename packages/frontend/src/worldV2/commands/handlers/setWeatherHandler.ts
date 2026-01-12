/**
 * SET_WEATHER Command Handler
 * 
 * Updates the weather on the active host node.
 */

import { useLocationsStore } from '@/store/slices/locations';
import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from '../types';
import { validationError, handleCommandError } from '../utils/commandUtils';

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

export async function handleSetWeatherCommand(
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
      'SET_WEATHER can only be used when a host, region, or location is selected'
    );
  }

  // Get weather from text
  const weather = text?.trim();
  
  if (!weather) {
    return validationError(
      callbacks,
      'Missing weather description. Usage: /SET_WEATHER <weather>\nExamples: "heavy rain", "clear and sunny", "foggy"'
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
    const response = await fetch('/api/v2/set-weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId, weather })
    });

    const result = await response.json();

    if (!response.ok) {
      return handleCommandError(callbacks, result.error, result.error || 'Failed to set weather');
    }

    // Reload locations store to reflect changes
    await useLocationsStore.getState().loadFromBackend();

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed to set weather');
  }
}
