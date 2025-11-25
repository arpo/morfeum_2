/**
 * Navigation Commands
 * 
 * Central definition of all navigation intents supported by the system.
 * Used by both frontend UI and backend navigation router.
 */

export const NAVIGATION_COMMANDS = [
  'GO_INSIDE',
  'GO_OUTSIDE',
  'GO_TO_ROOM',
  'GO_TO_PLACE',
  'LOOK_AT',
  'LOOK_THROUGH',
  'CHANGE_VIEW',
  'GO_UP_DOWN',
  'ENTER_PORTAL',
  'APPROACH',
  'EXPLORE_FEATURE',
  'RELOCATE'
] as const;

export type NavigationCommand = typeof NAVIGATION_COMMANDS[number];
