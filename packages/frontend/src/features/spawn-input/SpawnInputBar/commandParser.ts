import { COMMAND_FLAGS } from '@backend/config/navigation';

export interface ParsedCommand {
  command: string;
  text: string | undefined;
  flags: {
    createImage: boolean;
    backgroundTask: boolean;
  };
}

/**
 * Parse command input to extract command, text, and flags
 * Example: "/NEW_HOST London --create-image --bgtask"
 * Returns: { command: "NEW_HOST", text: "London", flags: { createImage: true, backgroundTask: true } }
 */
export function parseCommandInput(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const commandPart = parts[0].substring(1); // Remove leading /
  
  const flags = {
    createImage: false,
    backgroundTask: false
  };
  
  const textParts: string[] = [];
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part === COMMAND_FLAGS.CREATE_IMAGE) {
      flags.createImage = true;
    } else if (part === COMMAND_FLAGS.BACKGROUND_TASK) {
      flags.backgroundTask = true;
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
  return ['NEW_HOST', 'NEW_REGION', 'NEW_LOCATION', 'NEW_NICHE'].includes(command);
}

/**
 * Check if command is a media command
 */
export function isMediaCommand(command: string): boolean {
  return command === 'CREATE_IMAGE';
}

/**
 * Get node type from creation command
 */
export function getNodeTypeFromCommand(command: string): string {
  const nodeTypeMap: Record<string, string> = {
    NEW_HOST: 'host',
    NEW_REGION: 'region',
    NEW_LOCATION: 'location',
    NEW_NICHE: 'niche'
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
