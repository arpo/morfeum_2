/**
 * Element Rules - Optimized
 * Shared constants for dominantElements and navigableElements
 */

// ============================================================================
// DOMINANT ELEMENTS (seed data for GO_INSIDE command)
// ============================================================================

/**
 * Compact rules for dominantElements - PROMINENT ENTERABLE THINGS in scene
 */
export const DOMINANT_ELEMENTS_RULES = `DOMINANT ELEMENTS (GO_INSIDE targets):
Prominent STRUCTURES/OBJECTS you can ENTER: buildings, vehicles, containers, kiosks
NOT areas/zones (like "factory floor", "main hall")

FORMAT: "name: shape=form, orientation=pos, scale=size, style=aesthetic, surfaces=exterior, openings=windows/doors, interior_materials=walls|floor|ceiling, enterable=yes|no, internal_atmosphere=mood"

VALUES:
- SHAPE: rectangular|cylindrical|spherical|domed|organic|irregular|pyramidal|modular
- ORIENTATION: vertical(tower)|horizontal(train)|sprawling(complex)|compact(pod)|flowing(vessel)|centered(dome)
- SCALE: small|medium|large|massive|intimate|towering
- STYLE: brutalist|art-deco|victorian|futuristic|rustic|minimalist|industrial|sacred
- SURFACES: metallic-polished|stone|wood|glass|concrete|weathered|organic-membrane
- OPENINGS: large-glass|arched-windows|circular-portholes|narrow-slits|open-passages|minimal|none
- INTERIOR_MATERIALS: "wall|floor|ceiling" (metallic|wood|stone|glass|fabric|concrete|tile)
- INTERNAL_ATMOSPHERE: dim|bright|mystical|industrial|cozy|cramped|sterile|sacred

RULES: 1-3 items max. First item = main GO_INSIDE target. enterable=yes for enterable objects.`;

/**
 * Format example for JSON templates
 */
export const DOMINANT_ELEMENTS_EXAMPLE = 
  `"<structure>: shape=<form>, orientation=<pos>, scale=<size>, style=<aesthetic>, surfaces=<exterior>, openings=<type>, interior_materials=<walls|floor|ceiling>, enterable=<yes|no>, internal_atmosphere=<mood>"`;

/**
 * Format specifications for different node types
 */
export const DOMINANT_ELEMENTS_FORMAT = {
  location: DOMINANT_ELEMENTS_EXAMPLE,
  niche: `"3-5 major objects/features in this space"`,
  region: `"3-5 notable features or landmarks"`,
  host: `"3-5 major landmarks defining this world"`
} as const;

// ============================================================================
// NAVIGABLE ELEMENTS (for GOTO command)
// ============================================================================

/**
 * Compact rules for navigableElements - openings/passages for NAVIGATION
 */
export const NAVIGABLE_ELEMENTS_RULES = `NAVIGABLE ELEMENTS (GOTO targets):
Openings/passages for NAVIGATION within or out of location.
Types: door|passage|stairs|portal|window|bridge|path|gate|archway
FIRST item = MAIN ENTRANCE (GO_INSIDE target)`;

/**
 * Format example for navigableElements
 */
export const NAVIGABLE_ELEMENTS_EXAMPLE = 
  `{"type": "door|passage|stairs", "position": "where in scene", "description": "where it leads"}`;
