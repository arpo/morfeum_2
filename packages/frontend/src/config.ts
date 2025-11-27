/**
 * Frontend Application Configuration
 * Centralized configuration for the frontend application
 */

/**
 * Keyboard Shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_SPAWN_INPUT: '1',
  TOGGLE_ENTITY_EXPLORER: '2',
  TOGGLE_FOCUS_MODE: ' ', // Space key
} as const;

export const KEYBOARD_SHORTCUTS_DESCRIPTIONS = {
  [KEYBOARD_SHORTCUTS.TOGGLE_SPAWN_INPUT]: 'Toggle spawn input panel (exits focus mode if active)',
  [KEYBOARD_SHORTCUTS.TOGGLE_ENTITY_EXPLORER]: 'Toggle entity explorer panel (exits focus mode if active)',
  [KEYBOARD_SHORTCUTS.TOGGLE_FOCUS_MODE]: 'Toggle focus mode (hide/show all UI)',
} as const;

/**
 * UI Panel Settings
 */
export const PANEL_CONFIG = {
  ENTITY_EXPLORER: {
    DEFAULT_POSITION: { x: 20, y: 80 },
    DEFAULT_SIZE: { width: 350, height: 400 },
  },
} as const;

/**
 * Application Settings
 * Add other app-wide configuration here as needed
 */
export const APP_CONFIG = {
  // Add general app config here in the future
} as const;
