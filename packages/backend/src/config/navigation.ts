/**
 * Slash Commands Configuration
 * 
 * Central definition of all slash commands supported by the system.
 * Used by both frontend UI and backend navigation router.
 * 
 * Commands can have:
 * - requiresNodeType: Array of node types required to use this command (null = always available)
 * - description: Human-readable description shown in command dropdown
 * - category: Command category for grouping (navigation, creation, media)
 */

export type NodeType = 'host' | 'region' | 'location' | 'niche';

export interface SlashCommandConfig {
  requiresNodeType: NodeType[] | null;
  description: string;
  category: 'navigation' | 'creation' | 'media';
}

export const SLASH_COMMANDS: Record<string, SlashCommandConfig> = {
  // Navigation commands
  GO_INSIDE: { 
    requiresNodeType: ['location'], 
    description: 'Enter a location',
    category: 'navigation'
  },
  GOTO: { 
    requiresNodeType: ['niche'], 
    description: 'Navigate to a specific place within the current location',
    category: 'navigation'
  },
  
  // Node creation commands
  NEW_HOST: { 
    requiresNodeType: null, 
    description: 'Create a new host world',
    category: 'creation'
  },
  NEW_REGION: { 
    requiresNodeType: ['host'], 
    description: 'Create region in current host',
    category: 'creation'
  },
  NEW_LOCATION: { 
    requiresNodeType: ['region'], 
    description: 'Create location in current region',
    category: 'creation'
  },
  
  // Media commands
  VIEW: { 
    requiresNodeType: ['host', 'region', 'location', 'niche'], 
    description: 'Generate image for current node',
    category: 'media'
  }
} as const;

// All command names as array (for backward compatibility)
export const NAVIGATION_COMMANDS = Object.keys(SLASH_COMMANDS) as (keyof typeof SLASH_COMMANDS)[];

export type NavigationCommand = keyof typeof SLASH_COMMANDS;

// Flags supported by commands
export const COMMAND_FLAGS = {
  VIEW: '--view',
  NOVIEW: '--noview',
  BACKGROUND_TASK: '--bgtask',
  FURNISH: '--furnish'
} as const;

export type CommandFlag = typeof COMMAND_FLAGS[keyof typeof COMMAND_FLAGS];

/**
 * Get available commands for a given node type
 */
export function getAvailableCommands(currentNodeType: NodeType | null): string[] {
  return Object.entries(SLASH_COMMANDS)
    .filter(([_, config]) => {
      // Command with null requiresNodeType is always available
      if (config.requiresNodeType === null) return true;
      // If no current node, only show commands that don't require a node
      if (!currentNodeType) return false;
      // Check if current node type is allowed
      return config.requiresNodeType.includes(currentNodeType);
    })
    .map(([name]) => name);
}
