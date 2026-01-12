/**
 * World V2 Command Handlers
 *
 * Handles V2 slash commands (NEW_HOST, NEW_REGION, etc.)
 */

import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from './types';
import {
  handleNewHostCommand,
  handleNewRegionCommand,
  handleNewLocationCommand,
  handleDisplayCommand,
  handleSetTimeCommand,
  handleSetWeatherCommand
} from './handlers';

// Re-export types
export type { V2CommandCallbacks, V2CommandResult } from './types';

const V2_COMMANDS = ['NEW_HOST', 'NEW_REGION2', 'NEW_LOCATION2', 'DISPLAY', 'SET_TIME', 'SET_WEATHER'] as const;

/**
 * Check if command is a V2 command
 */
export function isV2Command(command: string): boolean {
  return V2_COMMANDS.includes(command as (typeof V2_COMMANDS)[number]);
}

/**
 * Handle V2 commands
 */
export async function handleV2Command(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { command } = parsedCommand;

  switch (command) {
    case 'NEW_HOST':
      return handleNewHostCommand(parsedCommand, callbacks);
    case 'NEW_REGION2':
      return handleNewRegionCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'NEW_LOCATION2':
      return handleNewLocationCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'DISPLAY':
      return handleDisplayCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'SET_TIME':
      return handleSetTimeCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'SET_WEATHER':
      return handleSetWeatherCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    default:
      return { success: false, error: `Unknown V2 command: ${command}` };
  }
}
