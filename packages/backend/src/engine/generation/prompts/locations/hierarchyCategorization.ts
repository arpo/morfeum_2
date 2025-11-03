/**
 * Hierarchy Categorization Prompt
 * 
 * Analyzes user input and categorizes it into a 4-layer hierarchy:
 * Host → Region → Location → Niche
 * 
 * @param userPrompt - The user's input to analyze
 * @returns Prompt string for LLM
 */
export function hierarchyCategorization(userPrompt: string): string {
  return `You are a spatial hierarchy analyzer. Organize user input into a 4-layer hierarchy: Host → Region → Location → Niche.

## CORE RULES

**1. MINIMAL BY DEFAULT**: Create ONLY what is explicitly mentioned.
- Simple phrase → Host only
- "Camden in London" → Host + Region  
- "Pub in Camden in London" → Host + Region + Location

**2. PATTERN MATCHING**: "[thing] [preposition] [WORD] in [WORD]"
- Prepositions: in, on, at, by, near, within, beside, around
- "club in Camden in London" → Host: London, Region: Camden, Location: club
- **Region name MUST be different from Host name**

**3. STRUCTURE KEYWORDS = LOCATION** (not Host):
Buildings: greenhouse, tower, shop, bar, pub, club, restaurant, cafe, temple, church, cathedral, observatory, lighthouse, dome, warehouse, factory, bunker, station, terminal, hangar, library, museum, theater, arena, stadium
Fantasy: castle, fortress, keep, dungeon, crypt, vault, sanctum, spire, inn, tavern, citadel, monastery, abbey
Sci-Fi: spaceship, starship, vessel, cruiser, freighter, shuttle, pod, module, sector, outpost, relay, beacon, colony, habitat
Transport: ship, boat, yacht, submarine, train, carriage, wagon, airship
Bio/Organic: hive, nest, cocoon, chrysalis
Architectural: bridge, fountain, monument, statue, gate, wall, archway, obelisk, pavilion, gazebo
Natural: cave, cavern, grotto, waterfall, grove, clearing, crater, canyon, ravine, valley, peak, summit

**4. AUTO-CREATE NICHE for interior/detail descriptions**:

When user describes contents WITHIN a structure, create a niche containing those elements.

**Detection Pattern**: "[structure] with [thing(s)]" → The things are INSIDE the structure
- "cave with stairs and machine" → Location: cave exterior, Niche: interior with stairs and machine
- "bar with dim lighting and tables" → Location: bar exterior, Niche: interior with lighting and tables
- "temple with altar and pillars" → Location: temple exterior, Niche: interior with altar and pillars
- "lighthouse" (no contents) → Location only, NO niche

**Reasoning**: Use spatial context, not keyword matching
- If user mentions features positioned inside/within a structure → Create niche
- If user only describes the structure itself → No niche needed
- Let the sentence structure guide you: "X with Y" typically means Y is inside X

**SPATIAL GROUPING** (critical):
- **Multiple elements in SAME space** → ONE niche
  - Connected by "and" in same sentence → SAME niche
  - Directional indicators ("to the left", "to the right", "center", "corner") → SAME niche (describing layout)
  - Example: "cave with stairs to the left and machine to the right" → ONE niche with both elements

- **Multiple SEPARATE spaces** → MULTIPLE niches
  - Separation keywords: "next to it", "adjacent room", "another room", "separate", "different room", "other side of", "through the", "beyond the", "past the", "neighboring"
  - Example: "cave with stairs and in the room next to it a machine" → TWO niches

Structure:
- Location = EXTERIOR description (the structure itself)
- Niche = INTERIOR/CONTENTS description (what's inside the structure)

## HIERARCHY LAYERS

| Layer    | Function                      | Visual Fields Required |
|----------|-------------------------------|------------------------|
| Host     | Broad setting, world laws     | name, description      |
| Region   | District/biome within world   | name, description      |
| Location | Specific enterable site       | name, description, looks, atmosphere, mood |
| Niche    | Space within location         | name, description, looks, atmosphere, mood |

**Visual Fields** (deepest node only):
- name: Evocative, memorable (not generic "Bar" or "Club")
  - Niches: Reflect atmosphere/mood (Ember, Hum, Echo) + distinctive features (Ascending, Vault, Sanctum)
  - Examples: "The Echoing Vault", "The Humming Sanctum", "The Ember Lounge", "The Spiral Ascent"
  - Avoid: "Interior", "Main Room", "Chamber" alone - always add descriptive qualifier
- description: 2-3 sentences
- looks: Visible geometry, layout, scale
- atmosphere: Air, motion, distinctive temperature/humidity
- mood: Concise emotional tone

## NESTING STRUCTURE

Each layer MUST nest inside its parent:
\`\`\`json
{
  "host": {
    "type": "host",
    "name": "London",
    "description": "...",
    "regions": [{
      "type": "region",
      "name": "Camden",
      "description": "...",
      "locations": [{
        "type": "location",
        "name": "The Anchor",
        "description": "...",
        "looks": "...",
        "atmosphere": "...",
        "mood": "...",
        "niches": [{
          "type": "niche",
          "name": "VIP Room",
          "description": "...",
          "looks": "...",
          "atmosphere": "...",
          "mood": "..."
        }]
      }]
    }]
  }
}
\`\`\`

## EXAMPLE OUTPUTS

**Input**: "A cozy bar with dim lighting in Camden"
\`\`\`json
{
  "host": {"type": "host", "name": "London", "description": "A vibrant city"},
  "regions": [{
    "type": "region",
    "name": "Camden",
    "description": "Industrial district with emerging nightlife",
    "locations": [{
      "type": "location",
      "name": "The Rustic Anchor",
      "description": "A traditional drinking establishment",
      "looks": "Weathered brick facade, wooden door, hanging pub sign",
      "atmosphere": "Street noise, evening foot traffic",
      "mood": "Inviting, unpretentious",
      "niches": [{
        "type": "niche",
        "name": "The Ember Lounge",
        "description": "The intimate interior bathed in warm light",
        "looks": "Dim Edison bulbs casting amber glow, dark wooden tables, exposed brick walls",
        "atmosphere": "Smoky warmth, low conversation, clinking glasses",
        "mood": "Cozy, relaxed"
      }]
    }]
  }]
}
\`\`\`

**Input**: "A lighthouse on rocky cliffs"
\`\`\`json
{
  "host": {"type": "host", "name": "Coastal Realm", "description": "Rugged shoreline"},
  "regions": [{
    "type": "region",
    "name": "The Storm Coast",
    "description": "Treacherous cliffside terrain",
    "locations": [{
      "type": "location",
      "name": "The Beacon's Edge",
      "description": "A solitary lighthouse on treacherous cliffs",
      "looks": "White cylindrical tower, glass dome, rocky foundation",
      "atmosphere": "Salt spray, howling wind, crashing waves",
      "mood": "Isolated, vigilant"
    }]
  }]
}
\`\`\`

**Input**: "A cave with a stair up to the left and an alien machine to the right"
\`\`\`json
{
  "host": {"type": "host", "name": "Underground Complex", "description": "Subterranean network"},
  "regions": [{
    "type": "region",
    "name": "Deep Caverns",
    "description": "Ancient cave system with mysterious technology",
    "locations": [{
      "type": "location",
      "name": "The Vault Cave",
      "description": "A large cave chamber housing strange artifacts",
      "looks": "Rough stone walls, natural formation with carved passages",
      "atmosphere": "Cool, damp air with mechanical hum",
      "mood": "Mysterious, ancient",
      "niches": [{
        "type": "niche",
        "name": "The Echoing Vault",
        "description": "The main chamber where ancient stairs meet alien technology",
        "looks": "Stone stairway ascending on the left side, alien machine with glowing panels positioned to the right",
        "atmosphere": "Echoing footsteps, low mechanical hum reverberating off stone",
        "mood": "Enigmatic, exploratory"
      }]
    }]
  }]
}
\`\`\`

**Input**: "A cave with a stair up to the left and in the room next to it an alien machine to the right"
\`\`\`json
{
  "host": {"type": "host", "name": "Underground Complex", "description": "Subterranean network"},
  "regions": [{
    "type": "region",
    "name": "Deep Caverns",
    "description": "Ancient cave system with multiple chambers",
    "locations": [{
      "type": "location",
      "name": "The Vault Cave",
      "description": "A cave complex with connected chambers",
      "looks": "Rough stone walls connecting multiple spaces",
      "atmosphere": "Cool, damp air with mechanical sounds in distance",
      "mood": "Mysterious, segmented",
      "niches": [
        {
          "type": "niche",
          "name": "The Ascending Passage",
          "description": "The first chamber with carved stairway leading upward",
          "looks": "Natural cave walls with carved stone stairway leading upward on left wall",
          "atmosphere": "Echo of dripping water, cool stone air",
          "mood": "Ancient, ascending"
        },
        {
          "type": "niche",
          "name": "The Humming Sanctum",
          "description": "Adjacent chamber housing alien technology",
          "looks": "Separate chamber with alien machine mounted on right wall, glowing controls pulsing with energy",
          "atmosphere": "Mechanical hum, warmer air radiating from machine",
          "mood": "Technological, isolated"
        }
      ]
    }]
  }]
}
\`\`\`

## PRE-OUTPUT VALIDATION

Run these checks:
1. Pattern "[thing] [prep] [WORD] in [WORD]" found? → Middle WORD must be Region
2. Region name identical to Host name? → CRITICAL ERROR, fix it
3. Empty Region descriptions? → ERROR, add descriptions
4. Only create layers explicitly mentioned or strongly implied

## OUTPUT FORMAT

Pure JSON only. No markdown fences. No explanations.

## USER INPUT

${userPrompt}`;
}
