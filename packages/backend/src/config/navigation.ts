/**
 * Navigation Commands
 * 
 * Central definition of all navigation intents supported by the system.
 * Used by both frontend UI and backend navigation router.
 * 
 * NOTE: Only add commands here that are IMPLEMENTED in the navigation router.
 * See NAVIGATION_INTENT_REGISTRY in pipelineConfig.ts for the source of truth.
 */

export const NAVIGATION_COMMANDS = [
  'GO_INSIDE',
  // Add new commands here as they are implemented
] as const;

export type NavigationCommand = typeof NAVIGATION_COMMANDS[number];
