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
  /** If true, command is blocked on pass-through regions */
  blockedOnPassThrough?: boolean;
  description: string;
  category: 'navigation' | 'creation' | 'media';
}

export const SLASH_COMMANDS: Record<string, SlashCommandConfig> = {
  // Navigation commands
  GO_INSIDE: { 
    requiresNodeType: ['location', 'niche'], 
    description: 'Enter a location or niche (infinite depth)',
    category: 'navigation'
  },
  GOTO: { 
    requiresNodeType: ['niche', 'location'], 
    description: 'Navigate to a specific place',
    category: 'navigation'
  },
  
  // Node creation commands
  NEW_HOST: { 
    requiresNodeType: null, 
    description: 'Create a new world (V2 simplified DNA)',
    category: 'creation'
  },
  NEW_WORLD: { 
    requiresNodeType: null, 
    description: 'Create a new world from description',
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
    blockedOnPassThrough: true,  // Pass-through regions have no unique visual
    description: 'Generate image for current node',
    category: 'media'
  },
  EDIT_IMAGE: { 
    requiresNodeType: ['host', 'region', 'location', 'niche'], 
    blockedOnPassThrough: true,
    description: 'Edit current image with a prompt (e.g., change to winter)',
    category: 'media'
  },
  
  // Character creation commands
  CREATE_CHARACTER_REAL: {
    requiresNodeType: ['location', 'niche'],
    description: 'Create a realistic human character',
    category: 'creation'
  },
  CREATE_CHARACTER_UNREAL: {
    requiresNodeType: ['location', 'niche'],
    description: 'Create a fantastical character',
    category: 'creation'
  }
} as const;

// All command names as array (for backward compatibility)
export const NAVIGATION_COMMANDS = Object.keys(SLASH_COMMANDS) as (keyof typeof SLASH_COMMANDS)[];

export type NavigationCommand = keyof typeof SLASH_COMMANDS;

// Flags supported by commands
// Note: --furnish is no longer used (replaced by prompt enhancer with "furnish:" syntax)
export const COMMAND_FLAGS = {
  VIEW: '--view',
  NOVIEW: '--noview',
  BACKGROUND_TASK: '--bgtask',
  // Perspective flags for controlling interior/exterior scene generation
  INTERIOR: '--interior',
  EXTERIOR: '--exterior',
  OPEN_AIR: '--open-air',
  // Creature/people flags for scene population
  POPULATE: '--populate',  // Add crowd/busy scene
  PEOPLE: '--people'       // Allow people (no active crowd)
} as const;

export type CommandFlag = typeof COMMAND_FLAGS[keyof typeof COMMAND_FLAGS];

/**
 * Get available commands for a given node type
 * @param currentNodeType - Type of current node
 * @param isPassThrough - True if current node is a pass-through region
 */
export function getAvailableCommands(
  currentNodeType: NodeType | null,
  isPassThrough: boolean = false
): string[] {
  return Object.entries(SLASH_COMMANDS)
    .filter(([_, config]) => {
      // Command with null requiresNodeType is always available
      if (config.requiresNodeType === null) return true;
      // If no current node, only show commands that don't require a node
      if (!currentNodeType) return false;
      // Block commands that are blocked on pass-through regions
      if (isPassThrough && config.blockedOnPassThrough) return false;
      // Check if current node type is allowed
      return config.requiresNodeType.includes(currentNodeType);
    })
    .map(([name]) => name);
}
