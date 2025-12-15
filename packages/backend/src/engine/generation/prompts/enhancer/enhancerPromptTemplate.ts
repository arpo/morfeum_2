/**
 * Prompt Enhancer Templates
 * 
 * These templates are used by the prompt enhancer service to suggest
 * navigableElements, furnishing, and facade details for commands.
 * 
 * This content was extracted from the pipeline prompts to make
 * enhancement user-controlled rather than automatic.
 */

/**
 * Instructions for suggesting navigable elements (doors, windows, passages)
 * Used for both interior and exterior spaces
 */
export const navigableElementsInstructions = `
NAVIGABLE ELEMENTS - What openings/passages should this space have?

For INTERIOR spaces, suggest 2-4 navigation points:
- Doors: main entrance, connecting doors to other rooms, closet doors
- Windows: with specific positions (left wall, front wall, etc.)
- Passages: archways, open doorways, corridors
- Stairs: if multi-level space
- Special: elevators, hatches, hidden doors (genre-appropriate)

For EXTERIOR spaces (building facades), suggest 1-3 entry points:
- Main entrance: door type, position, style
- Secondary entrances: side doors, service entrances
- Windows: arrangement, style, what's visible through them
- Gates/archways: for courtyards, gardens

FORMAT your suggestions as:
"navigable elements: [element1] [position1], [element2] [position2]"

Examples:
- "navigable elements: wooden door left wall, large window front wall with garden view, archway right leading to hallway"
- "navigable elements: glass double doors center, display windows flanking entrance, service door right side"
`;

/**
 * Instructions for suggesting interior furnishing
 * Based on functional type of the space
 */
export const furnishingInstructions = `
INTERIOR FURNISHING - What objects should fill this space?

Based on the space's purpose, suggest appropriate fixtures and furniture.
The space should NOT be empty - it must contain objects appropriate to its function.

FURNISHING BY SPACE TYPE:

RETAIL/COMMERCIAL (shops, boutiques, stores, markets):
- Display racks with merchandise
- Sales counter or checkout area
- Mannequins with clothing (if clothing store)
- Shelving units with products
- Price tags, branded signage, fitting room entrances

RESIDENTIAL (homes, apartments, living quarters):
- Seating (sofas, chairs, armchairs)
- Tables (coffee table, dining table, side tables)
- Storage furniture (cabinets, bookshelves)
- Rugs, curtains, artwork, personal items

RELIGIOUS (temples, churches, shrines, chapels):
- Central altar or sacred focal point
- Seating or prayer areas (pews, cushions, mats)
- Religious symbols, statues, or iconography
- Candles, incense, ceremonial objects

ENTERTAINMENT (clubs, bars, theaters, restaurants, lounges, cafes):
- Seating areas (booths, lounge chairs, bar stools)
- Bar counter or service area
- Performance area (stage, dance floor, DJ booth)
- Atmospheric lighting, sound equipment, drink displays

INDUSTRIAL (factories, warehouses, workshops, garages):
- Machinery or workstations
- Storage systems (racks, pallets, shelving)
- Control panels or monitoring equipment
- Safety signage, tool storage, transport equipment

CIVIC (offices, libraries, museums, galleries):
- Desks, workstations, or display cases
- Seating for visitors
- Information displays or exhibits
- Reception areas, wayfinding signage

SPA/WELLNESS:
- Treatment beds, massage tables
- Relaxation seating (loungers, meditation cushions)
- Water features (pools, jacuzzis, fountains)
- Plants, towels, robes, ambient lighting

FORMAT your suggestions as:
"furnish: [item1], [item2], [item3], [item4]"

Examples:
- "furnish: circular jacuzzi with bubbling water, spa loungers with white towels, potted palms, ambient candles"
- "furnish: oak bar counter with brass rails, leather booth seating, vintage jukebox, neon beer signs"
`;

/**
 * Instructions for suggesting facade/exterior details
 * Used for NEW_LOCATION commands (building exteriors)
 */
export const facadeInstructions = `
FACADE DETAILS - What should the building exterior look like?

For building exteriors, suggest architectural and decorative elements:

ENTRANCE DETAILS:
- Door type: wooden, glass, metal, ornate, industrial
- Door style: single, double, revolving, sliding, arched
- Surrounding elements: frame, steps, ramp, canopy, awning

WINDOW ARRANGEMENTS:
- Type: display windows, residential windows, industrial windows
- Style: large plate glass, small panes, arched, circular
- Details: shutters, window boxes, signage in windows

FACADE PROPS:
- Signage: hanging signs, neon signs, painted lettering
- Decorative: awnings, planters, flags, banners
- Functional: mailbox, doorbell, lighting fixtures
- Street elements: benches, bike racks, outdoor seating

FORMAT your suggestions as:
"facade: [description of entrance], [window details], [decorative elements]"

Examples:
- "facade: glass storefront with striped awning, display windows showing baked goods, brass door handle and bell"
- "facade: weathered wooden door with iron studs, narrow windows with flower boxes, hanging tavern sign"
`;

/**
 * Build the full enhancer prompt for a given command type
 */
export function buildEnhancerPrompt(
  commandType: 'GO_INSIDE' | 'GOTO' | 'NEW_LOCATION',
  currentNodeContext: {
    name: string;
    type: string;
    description?: string;
    dna?: any;
    navigableElements?: Array<{ type: string; position: string; description: string }>;
  },
  destinationText: string
): string {
  const isExterior = commandType === 'NEW_LOCATION';
  const hasNavigableElements = currentNodeContext.navigableElements && currentNodeContext.navigableElements.length > 0;
  
  let prompt = `You are an expert at suggesting scene details for image generation.

TASK: Suggest appropriate details to enhance a scene description.

=== CURRENT CONTEXT ===
Current location: "${currentNodeContext.name}" (${currentNodeContext.type})
${currentNodeContext.description ? `Description: ${currentNodeContext.description}` : ''}
${currentNodeContext.dna?.architectural_tone ? `Architectural style: ${currentNodeContext.dna.architectural_tone}` : ''}
${currentNodeContext.dna?.cultural_tone ? `Cultural context: ${currentNodeContext.dna.cultural_tone}` : ''}
${hasNavigableElements ? `
=== EXISTING ENTRANCES ===
${currentNodeContext.navigableElements!.map(e => `- ${e.type} at ${e.position}: ${e.description}`).join('\n')}
` : ''}
=== USER'S DESTINATION ===
"${destinationText}"

=== YOUR TASK ===
`;

  if (isExterior) {
    prompt += `
This is a NEW_LOCATION command creating a BUILDING EXTERIOR.
Suggest facade details that would make this building visually interesting.

${facadeInstructions}

${navigableElementsInstructions}
`;
  } else {
    prompt += `
This is a ${commandType} command creating an INTERIOR space.
Suggest navigable elements and furnishing appropriate for this space.

${navigableElementsInstructions}

${furnishingInstructions}
`;
  }

  prompt += `
=== OUTPUT FORMAT ===
Return a single line that can be appended to the user's command.
${isExterior 
  ? 'Format: "facade: [details], navigable elements: [elements]"'
  : 'Format: "navigable elements: [elements], furnish: [items]"'
}

Be specific but concise. Match the style/era of the current location.
`;

  return prompt;
}
