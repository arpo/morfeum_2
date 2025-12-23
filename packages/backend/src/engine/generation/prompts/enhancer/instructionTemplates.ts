/**
 * Prompt Enhancer Instruction Templates
 * 
 * These templates are used by the prompt enhancer service to suggest
 * navigableElements, furnishing, and facade details for commands.
 */

/**
 * Instructions for suggesting navigable elements (doors, windows, passages)
 * Different position terminology for interior vs exterior
 */
export const navigableElementsInteriorInstructions = `
NAVIGABLE ELEMENTS (INTERIOR) - What openings should this enclosed space have?

For INTERIOR spaces with walls, suggest 2-4 navigation points:
- Doors: main entrance, connecting doors to other rooms, closet doors
- Windows: with specific positions (left wall, front wall, etc.)
- Passages: archways, open doorways, corridors
- Stairs: if multi-level space
- Special: elevators, hatches, hidden doors (genre-appropriate)

FORMAT your suggestions as:
"navigable elements: [element1] [position1], [element2] [position2]"

Examples:
- "navigable elements: wooden door left wall, large window front wall with garden view, archway right leading to hallway"
`;

export const navigableElementsExteriorInstructions = `
NAVIGABLE ELEMENTS (EXTERIOR) - What paths/passages lead to/from this outdoor space?

For EXTERIOR spaces WITHOUT walls, suggest 1-3 paths or connections:
- Paths: dirt path, stone walkway, forest trail (north, south, east, west)
- Openings: clearing edges, forest boundaries, garden entrances
- Features: bridge, stepping stones, gate in fence
- Views: what's visible in different directions

IMPORTANT: Do NOT use "wall" positions (left wall, front wall) - this is an OPEN outdoor space!
Use directional or descriptive positions instead:
- "north side", "eastern edge", "toward the forest"
- "clearing entrance", "path leading to", "near the fountain"

FORMAT your suggestions as:
"navigable elements: [element] [direction/position], [element] [direction/position]"

Examples:
- "navigable elements: winding path north toward main gathering, stone steps east to lookout point, forest trail west into deeper woods"
- "navigable elements: wooden bridge crossing stream to the south, clearing opening northeast to sculpture garden"
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
 * Instructions for suggesting exterior niche elements
 * Used for fully outdoor spaces (parks, plazas, gardens, art installations)
 */
export const exteriorNicheInstructions = `
EXTERIOR SPACE ELEMENTS - What features should this outdoor space have?

For fully outdoor spaces, suggest terrain, vegetation, and points of interest.
These spaces have NO roof and are completely open to the environment.

NATURAL LANDSCAPES (parks, gardens, forests, beaches):
- Vegetation: trees, shrubs, flower beds, grass areas, ground cover
- Terrain: pathways, clearings, slopes, rocky areas, sandy patches
- Water: streams, ponds, fountains, waterfalls
- Seating: benches, stones, logs, grass areas for sitting
- Lighting: lampposts, ground lights, string lights, lanterns

ART INSTALLATIONS (galleries, sculpture parks, Burning Man-style):
- Structures: sculptures, interactive pieces, art platforms
- Zones: viewing areas, gathering spaces, performance circles
- Utilities: shade structures, seating pods, water stations
- Lighting: dramatic spotlights, ambient glows, projection surfaces
- Paths: connecting walkways, observation points, photo spots

URBAN EXTERIOR (plazas, courtyards, market squares):
- Hardscape: paved areas, steps, platforms, cobblestones
- Street furniture: benches, planters, bollards, fountains
- Lighting: streetlights, architectural lighting, festive lights
- Commercial: stalls, kiosks, outdoor dining areas

FORMAT your suggestions as:
"exterior elements: [item1], [item2], [item3], [item4]"

Examples:
- "exterior elements: winding gravel path, glowing sculpture cluster, wooden viewing platform, ambient ground lighting"
- "exterior elements: central fountain with stone benches, flowering trees, cobblestone pathways, vintage lampposts"
`;

/**
 * Instructions for suggesting open-air space elements
 * Used for semi-enclosed spaces (balconies, terraces, rooftops)
 */
export const openAirInstructions = `
OPEN-AIR SPACE ELEMENTS - What features should this semi-enclosed space have?

For spaces with partial walls/railings but open sky (balcony, terrace, rooftop, patio).
These spaces blend interior comfort with exterior exposure.

BALCONIES/TERRACES:
- Railings: wrought iron, glass panels, wooden balustrades, cable rails
- Flooring: wood decking, stone tiles, concrete, artificial turf
- Seating: lounge chairs, bistro sets, hammocks, daybeds
- Plants: potted plants, climbing vines, planters, hanging baskets
- Views: what's visible, focal points in the distance

ROOFTOPS:
- Rooftop bar elements: bar counter, high stools, cocktail tables
- Lounge areas: sectional sofas, fire pits, pergolas
- Urban gardening: raised beds, herb planters, small trees
- Entertainment: projection screens, speakers, dance floor
- Safety: barriers, lighting along edges

COVERED PATIOS/PERGOLAS:
- Overhead: partial cover, vines, retractable awning, string lights
- Dining: tables, chairs, outdoor kitchen area
- Comfort: heaters, fans, misting systems
- Decor: outdoor rugs, cushions, lanterns

FORMAT your suggestions as:
"open-air elements: [item1], [item2], [item3], [item4]"

Examples:
- "open-air elements: iron railing with city view, teak lounge chairs, potted olive trees, string lights overhead"
- "open-air elements: wooden pergola with climbing wisteria, stone fire pit, cushioned sectional, moroccan lanterns"
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
