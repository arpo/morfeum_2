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
 * 
 * Enhanced format supports sub-niche creation by providing shape, orientation,
 * and interior hints that are used when entering the element.
 */
export const DOMINANT_ELEMENTS_RULES = `DOMINANT ELEMENTS (seed data for GO_INSIDE):
- PROMINENT STRUCTURES or OBJECTS in the scene you can ENTER
- Buildings: café, factory, temple, house, shop, warehouse
- Vehicles/Objects: car, spaceship, kiosk, telephone booth, container
- NOT areas/zones (like "factory floor", "main hall" - these are parts of the location)

FORMAT: "[name]: shape=[form], orientation=[position], scale=[size], style=[aesthetic], surfaces=[exterior], openings=[windows/doors], interior_materials=[walls|floor|ceiling], enterable=[yes|no], internal_atmosphere=[mood]"

SHAPE values (the base form):
- rectangular, cylindrical, spherical, domed, organic, irregular, pyramidal, modular, tiered, compact
- Can combine with style: rectangular-industrial, domed-classical, organic-futuristic

ORIENTATION values (how it sits in space - CRITICAL for interior layout):
- vertical: stands upright (rocket, silo, tower, lighthouse)
- horizontal: lays lengthwise (train, submarine, tunnel, log)
- sprawling: spreads outward (complex, compound, station)
- compact: contained, roughly equal dimensions (pod, cabin, booth)
- flowing: organic movement direction (alien vessel, creature)
- centered: radiates from center (dome, sphere, gazebo)

SCALE values: small, medium, large, massive, intimate, towering

STYLE values: brutalist, art-deco, victorian, futuristic, rustic, minimalist, industrial, commercial, sacred, ornate

SURFACES (exterior appearance): metallic-polished, stone, wood, glass, concrete, weathered, organic-membrane

OPENINGS (windows/doors type - CRITICAL for interior):
- large-glass: floor-to-ceiling windows, glass walls
- arched-windows: traditional arched openings
- circular-portholes: round windows (ships, submarines, spacecraft)
- narrow-slits: defensive/industrial thin openings
- open-passages: doorways without doors, archways
- minimal: few small openings
- none: solid walls, no natural light

INTERIOR_MATERIALS (walls|floor|ceiling - pipe separated):
- Format: "wall-material|floor-material|ceiling-material"
- Examples: "brushed-metal|grated-floor|ribbed-ceiling", "carved-stone|marble-tile|vaulted-stone"
- Use for each: metallic, wood, stone, glass, fabric, organic-membrane, concrete, tile

ENTERABLE: yes (can GO_INSIDE) or no (solid/decorative object)

INTERNAL_ATMOSPHERE (mood inside - used when entering):
- dim, bright, mystical, industrial, cozy, cramped, sterile, sacred, clinical, cavernous

RULES:
- Usually 1-3 items maximum - the MAIN things visible in the scene
- First item should be the main target for GO_INSIDE if applicable
- Mark enterable=yes for objects the user can enter
- Include openings and interior_materials for enterable objects`;

/**
 * Generic format placeholder for JSON templates.
 * Shows the FORMAT pattern, not specific content (to prevent LLM from copying literally).
 * Enhanced format includes orientation, openings, interior materials, and internal atmosphere.
 */
export const DOMINANT_ELEMENTS_EXAMPLE = 
  `"<enterable_structure>: shape=<form>, orientation=<position>, scale=<size>, style=<aesthetic>, surfaces=<exterior>, openings=<windows/doors>, interior_materials=<walls|floor|ceiling>, enterable=<yes|no>, internal_atmosphere=<mood>"`;

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
