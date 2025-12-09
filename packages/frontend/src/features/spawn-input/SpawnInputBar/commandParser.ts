import { COMMAND_FLAGS } from '@backend/config/navigation';

export interface ParsedCommand {
  command: string;
  text: string | undefined;
  flags: {
    createImage: boolean;
    backgroundTask: boolean;
    furnish: boolean;
  };
}

/**
 * Parse command input to extract command, text, and flags
 * Example: "/NEW_HOST London --view --bgtask"
 * Returns: { command: "NEW_HOST", text: "London", flags: { createImage: true, backgroundTask: true } }
 */
export function parseCommandInput(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const commandPart = parts[0].substring(1); // Remove leading /
  
  const flags = {
    createImage: true,
    backgroundTask: false,
    furnish: false
  };
  
  const textParts: string[] = [];
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part === COMMAND_FLAGS.NOVIEW || part === '-noview') {
      flags.createImage = false;
    } else if (part === COMMAND_FLAGS.VIEW || part === '-view') {
      flags.createImage = true;
    } else if (part === COMMAND_FLAGS.BACKGROUND_TASK || part === '-bgtask') {
      flags.backgroundTask = true;
    } else if (part === COMMAND_FLAGS.FURNISH) {
      flags.furnish = true;
    } else if (!part.startsWith('--')) {
      textParts.push(part);
    }
  }
  
  return {
    command: commandPart.toUpperCase(),
    text: textParts.length > 0 ? textParts.join(' ') : undefined,
    flags
  };
}

/**
 * Check if command is a creation command
 */
export function isCreationCommand(command: string): boolean {
  return ['NEW_HOST', 'NEW_REGION', 'NEW_LOCATION'].includes(command);
}

/**
 * Check if command is a media command
 */
export function isMediaCommand(command: string): boolean {
  return command === 'VIEW';
}

/**
 * Check if command is a navigation command
 * Navigation commands navigate within the world tree (GO_INSIDE, GOTO)
 */
export function isNavigationCommand(command: string): boolean {
  return ['GO_INSIDE', 'GOTO'].includes(command);
}

/**
 * Get node type from creation command
 */
export function getNodeTypeFromCommand(command: string): string {
  const nodeTypeMap: Record<string, string> = {
    NEW_HOST: 'host',
    NEW_REGION: 'region',
    NEW_LOCATION: 'location'
  };
  return nodeTypeMap[command] || 'location';
}

/**
 * Map node type to spawn entity type
 */
export function getSpawnEntityType(nodeType: string): 'character' | 'location' | 'niche' {
  const entityTypeMap: Record<string, 'character' | 'location' | 'niche'> = {
    host: 'location',
    region: 'location',
    location: 'location',
    niche: 'niche'
  };
  return entityTypeMap[nodeType] || 'location';
}
