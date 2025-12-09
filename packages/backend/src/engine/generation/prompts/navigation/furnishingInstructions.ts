/**
 * INTERIOR FURNISHING INSTRUCTIONS
 * Used to extend structure analysis prompt when furnishing is requested.
 * Full detailed version from interiorInstructions-copy.txt section 6.
 */

export const furnishingInstructions = `
6. INTERIOR FURNISHING (MANDATORY - NOT OPTIONAL):
Based on the functionalType from the structure data, you MUST include appropriate fixtures.
The interior should NOT be empty - it must contain objects appropriate to its function.

Examples by FUNCTIONAL TYPE:
RETAIL/COMMERCIAL SPACES (shops, boutiques, stores, malls, markets, kiosks, showrooms, etc):
- Display racks with merchandise (5-10 throughout space)
- Sales counter or checkout area in midground
- Mannequins with clothing (2-4 positioned asymmetrically)
- Shelving units with products
- Add: Price tags, branded signage, fitting room entrances

RESIDENTIAL SPACES (homes, apartments, living quarters, dormitories, cabins, cottages, etc):
- Seating (sofas, chairs, armchairs)
- Tables (coffee table, dining table, side tables)
- Storage furniture (cabinets, bookshelves)
- Add: Rugs, curtains, artwork, personal items

RELIGIOUS SPACES (temples, churches, shrines, chapels, mosques, synagogues, etc):
- Central altar or sacred focal point
- Seating or prayer areas (pews, cushions, mats)
- Religious symbols, statues, or iconography
- Add: Candles, incense, ceremonial objects

ENTERTAINMENT SPACES (clubs, bars, theaters, restaurants, lounges, cafes, pubs, dining areas, banquet halls, cafeterias, food courts etx):
- Seating areas (booths, lounge chairs, bar stools)
- Bar counter or service area
- Performance area (stage, dance floor, DJ booth)
- Add: Atmospheric lighting, sound equipment, drink displays

INDUSTRIAL SPACES (factories, warehouses, workshops, garages, plants, foundries, mills, depots, hangars, docks, shipyards, etc):
- Machinery or workstations
- Storage systems (racks, pallets, shelving)
- Control panels or monitoring equipment
- Add: Safety signage, tool storage, transport equipment

CIVIC SPACES (offices, libraries, museums, galleries, community centers, etc):
- Desks, workstations, or display cases
- Seating for visitors
- Information displays or exhibits
- Add: Reception areas, wayfinding signage

OUTPUT: In your JSON result, always include a "furnishingDetails" object:
{
  "furnishingDetails": {
    "userSpecified": ["array of user-specified items"],
    "suggested": ["array of suggested furnishings"],
    "placementNotes": ["array of placement or style notes"]
  }
}
`;
