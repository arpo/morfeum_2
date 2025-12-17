/**
 * Element Rules - Shared constants for dominantElements and navigableElements
 * Single source of truth - import in all prompt files
 */

// ============================================================================
// DOMINANT ELEMENTS (seed data for GO_INSIDE command)
// ============================================================================

/**
 * Compact rules string for dominantElements - use in prompts BEFORE the JSON template.
 * IMPORTANT: dominantElements are the PROMINENT ENTERABLE THINGS in the scene.
 * Can be buildings, structures, vehicles, or objects you can GO_INSIDE.
 */
export const DOMINANT_ELEMENTS_RULES = `DOMINANT ELEMENTS (seed data for GO_INSIDE):
- PROMINENT STRUCTURES or OBJECTS in the scene you can ENTER
- Buildings: café, factory, temple, house, shop, warehouse
- Vehicles/Objects: car, spaceship, kiosk, telephone booth, container
- NOT areas/zones (like "factory floor", "main hall" - these are parts of the location)
- FORMAT: "[name]: [shape/style], [scale], [interior|exterior|open-air], [floor], [walls], [lighting]"
- PERSPECTIVE values:
  - interior: enclosed space with roof/ceiling (rooms, halls, caves, vehicle interiors)
  - exterior: fully open outdoor space (parks, plazas, gardens, forests)
  - open-air: semi-enclosed with open sky (balconies, terraces, rooftops, covered patios)
- Usually 1-3 items maximum - the MAIN things visible in the scene
- First item should be the main target for GO_INSIDE if applicable`;

/**
 * Generic format placeholder for JSON templates.
 * Shows the FORMAT pattern, not specific content (to prevent LLM from copying literally).
 */
export const DOMINANT_ELEMENTS_EXAMPLE = 
  `"<enterable_structure>: <shape/style>, <scale>, <interior|exterior|open-air>, <floor_material>, <wall_features>, <lighting_type>"`;

/**
 * Format specifications for different node types.
 */
export const DOMINANT_ELEMENTS_FORMAT = {
  /** Format for locations - enterable structures with interior descriptions */
  location: DOMINANT_ELEMENTS_EXAMPLE,
  
  /** Format for niches (interior spaces) - major objects/features, not enterable */
  niche: `"3-5 major objects/features in this space"`,
  
  /** Format for regions - landmarks and features */
  region: `"3-5 notable features or landmarks in this region"`,
  
  /** Format for host worlds - major defining features */
  host: `"3-5 major landmarks or features that define this world"`
} as const;

// ============================================================================
// NAVIGABLE ELEMENTS (for GOTO command)
// ============================================================================

/**
 * Compact rules string for navigableElements - use in prompts BEFORE the JSON template.
 * IMPORTANT: navigableElements are openings/passages used for NAVIGATION.
 */
export const NAVIGABLE_ELEMENTS_RULES = `NAVIGABLE ELEMENTS (for GOTO command):
- Openings/passages you can use to NAVIGATE within or out of a location
- Types: door, passage, stairs, portal, window, bridge, path, gate, archway
- FIRST item = MAIN ENTRANCE (used for GO_INSIDE targeting)
- Each entry describes WHERE it leads and what's visible through it`;

/**
 * Generic format placeholder for navigableElements in JSON templates.
 */
export const NAVIGABLE_ELEMENTS_EXAMPLE = 
  `{"type": "door|passage|stairs", "position": "where in scene", "description": "where it leads"}`;
