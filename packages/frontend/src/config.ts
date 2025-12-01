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
 * World View 3D Settings
 * Controls for the depth-based 3D rendering in WorldView
 */
export const WORLD_VIEW_3D_CONFIG = {
  /** Depth scale - how much the 3D should "bulge" out (0.1 = subtle, 2.0 = extreme) */
  MESH_DEPTH: 0.5,
  
  /** Focus plane - depth at which objects stay still during parallax (0 = far, 1 = near) */
  FOCUS: 0.25,
  
  /** Camera movement amplitude - how far the view shifts during animation (shader parallax) */
  CAMERA_AMPLITUDE: {
    X: 0.55,   // Horizontal shift range
    Y: 0.5,   // Vertical shift range
    Z: 0.33,  // Zoom range (camera z position offset)
    ROLL: 0.05,  // Camera roll/tilt amplitude in radians (~1.7 degrees)
  },
  
  /** Camera position movement - physical camera tilt to see mesh from angle */
  CAMERA_POSITION: {
    X: 0.15,  // How far camera moves left/right (creates side view)
    Y: 0.1,   // How far camera moves up/down (creates top/bottom view)
  },
  
  /** Base camera distance - lower = closer to image, avoids black edges (default 4) */
  BASE_CAMERA_Z: 2.5,
  
  /** Camera movement speed - each axis has independent circular motion */
  CAMERA_SPEED: {
    MULTIPLIER: 1.75, // Overall speed multiplier (0.5 = half speed, 2.0 = double speed)
    X: 0.000333,  // Horizontal cycle (~7.8 sec)
    Y: 0.00022,  // Vertical cycle (~10.5 sec)
    Z: 0.0001,  // Zoom cycle (~15.7 sec, slowest for subtle breathing)
    ROLL: 0.00012,  // Roll cycle (~13 sec, slow head tilt)
  },
  
  /** Easing factor for movement smoothness (0.01 = very smooth, 0.2 = snappy) */
  EASING: 0.05,
  
  /** Mesh resolution - higher = more detailed depth geometry (performance impact) */
  MESH_RESOLUTION: 2048 *2,
  
  /** Letterbox - black bars at top/bottom to enforce 16:9 aspect ratio */
  LETTERBOX: {
    ENABLED: true, // Enable/disable 16:9 letterbox cropping
    EXTRA_HEIGHT: 40, // Additional pixels to add to each bar (to cut off more edges)
  },
  
  /** Depth map expansion radius - dilates depth values to reduce edge artifacts (0 = disabled, 7 = tiefling default) */
  EXPAND_DEPTHMAP_RADIUS: 7,
  
  /** Depth-dependent expansion - if true, near objects get more expansion, far objects get less */
  EXPAND_DEPTHMAP_DEPTH_SCALE: true,
  
  /** Minimum scale factor for far objects when depth scaling is enabled (0.0 = no expansion for far, 1.0 = full expansion for all) */
  EXPAND_DEPTHMAP_MIN_SCALE: 0.6,
  
  /** Particle effects - floating dust, snow, rain, etc. */
  PARTICLES: {
    ENABLED: true,
    PRESET: 'dust', // 'dust' | 'snow' | 'rain' | 'fireflies' | 'embers' | 'fog' | 'bubbles' | 'sparks' | 'stars' | 'ash' | 'pollen'
    DEPTH: 6, // Particle depth range (2 = shallow, 4 = moderate, 6+ = deep spread with more size variation)
  },
  
  /** Post-processor effects - image displacement/distortion */
  POSTPROCESSOR: {
    ENABLED: false,
    PRESET: 'heatwave', // 'heatwave' | 'underwater' | 'glitch' | 'dream'
  },
  
  /** Scene presets - combined particle + post-processor + color effects */
  SCENE: {
    ENABLED: false,  // Set to true to test scenes!
    PRESET: 'magical', // 'sunset' | 'storm' | 'underwater' | 'haunted' | 'magical' (magical has bloom: 0.5)
  },
} as const;

/**
 * Application Settings
 * Add other app-wide configuration here as needed
 */
export const APP_CONFIG = {
  // Add general app config here in the future
} as const;
