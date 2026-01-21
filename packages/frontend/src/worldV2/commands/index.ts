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
  handleNewWorldLocationCommand,
  handleNewWorldLocationInteriorCommand,
  handleGoInsideCommand,
  handleGotoCommand,
  handleLookCommand,
  handleDisplayCommand,
  handleSetTimeCommand,
  handleSetWeatherCommand,
  handleEditImageCommand
} from './handlers';

// Re-export types
export type { V2CommandCallbacks, V2CommandResult } from './types';

const V2_COMMANDS = ['NEW_HOST', 'NEW_REGION2', 'NEW_LOCATION', 'NEW_WORLD_LOCATION', 'NEW_WORLD_LOCATION_INTERIOR', 'GO_INSIDE', 'GOTO', 'LOOK', 'DISPLAY', 'SET_TIME', 'SET_WEATHER', 'EDIT_IMAGE'] as const;

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
    case 'NEW_WORLD_LOCATION':
      return handleNewWorldLocationCommand(parsedCommand, callbacks);
    case 'NEW_WORLD_LOCATION_INTERIOR':
      return handleNewWorldLocationInteriorCommand(parsedCommand, callbacks);
    case 'NEW_REGION2':
      return handleNewRegionCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'NEW_LOCATION':
      return handleNewLocationCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'DISPLAY':
      return handleDisplayCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'SET_TIME':
      return handleSetTimeCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'SET_WEATHER':
      return handleSetWeatherCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'GO_INSIDE':
      return handleGoInsideCommand(parsedCommand, callbacks, activeEntityId || undefined);
    case 'GOTO':
      return handleGotoCommand(parsedCommand, callbacks, activeEntityId || undefined);
    case 'LOOK':
      return handleLookCommand(parsedCommand, callbacks, activeEntityId || undefined);
    case 'EDIT_IMAGE':
      return handleEditImageCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    default:
      return { success: false, error: `Unknown V2 command: ${command}` };
  }
}
