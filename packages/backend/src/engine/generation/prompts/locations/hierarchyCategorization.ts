/**
 * Hierarchy Categorization Prompt - Optimized
 * Analyzes user input into 4-layer hierarchy: Host → Region → Location → Niche
 */
export function hierarchyCategorization(userPrompt: string): string {
  return `Spatial hierarchy analyzer. Organize input into: Host → Region → Location → Niche.

## RULES

1. MINIMAL: Create ONLY explicitly mentioned layers.
   - Simple phrase → Host only
   - "Camden in London" → Host + Region
   - "Pub in Camden in London" → Host + Region + Location

2. PATTERN: "[thing] [prep] [WORD] in [WORD]" → Middle=Region, Last=Host
   - Preps: in|on|at|by|near|within|beside|around
   - Region name MUST differ from Host name

3. STRUCTURE KEYWORDS = LOCATION (not Host):
   Buildings: greenhouse|tower|shop|bar|pub|club|restaurant|cafe|temple|church|cathedral|observatory|lighthouse|warehouse|factory|station|library|museum|theater|arena
   Fantasy: castle|fortress|dungeon|crypt|vault|sanctum|inn|tavern|citadel|monastery
   Sci-Fi: spaceship|starship|vessel|cruiser|shuttle|pod|module|outpost|colony|habitat
   Transport: ship|boat|yacht|submarine|train|airship
   Natural: cave|cavern|grotto|waterfall|grove|clearing|canyon|valley|peak

4. AUTO-NICHE for interior descriptions:
   - "[structure] with [things]" → things are INSIDE → create niche
   - "cave with stairs and machine" → Location: cave exterior, Niche: interior with elements
   - "lighthouse" (no contents) → Location only, NO niche
   
   SPATIAL GROUPING:
   - Same space (connected by "and", directional words) → ONE niche
   - Separate spaces ("next to it", "adjacent", "another room") → MULTIPLE niches

## LAYER FIELDS

| Layer    | Fields |
|----------|--------|
| Host     | name, description |
| Region   | name, description |
| Location | name, description, looks, atmosphere, mood |
| Niche    | name, description, looks, atmosphere, mood |

Visual fields (deepest node):
- name: Evocative (not "Bar" → "The Ember Lounge", "The Echoing Vault")
- description: 2-3 sentences
- looks: geometry, layout, scale
- atmosphere: air, motion, temperature
- mood: emotional tone

## STRUCTURE

\`\`\`json
{
  "host": {
    "type": "host", "name": "", "description": "",
    "regions": [{
      "type": "region", "name": "", "description": "",
      "locations": [{
        "type": "location", "name": "", "description": "", "looks": "", "atmosphere": "", "mood": "",
        "niches": [{ "type": "niche", "name": "", "description": "", "looks": "", "atmosphere": "", "mood": "" }]
      }]
    }]
  }
}
\`\`\`

## EXAMPLES

**Input**: "A cozy bar with dim lighting in Camden"
\`\`\`json
{
  "host": {"type": "host", "name": "London", "description": "A vibrant city"},
  "regions": [{
    "type": "region", "name": "Camden", "description": "Industrial district with nightlife",
    "locations": [{
      "type": "location", "name": "The Rustic Anchor", "description": "Traditional drinking establishment",
      "looks": "Weathered brick facade, wooden door, hanging pub sign",
      "atmosphere": "Street noise, evening foot traffic", "mood": "Inviting",
      "niches": [{
        "type": "niche", "name": "The Ember Lounge", "description": "Intimate interior bathed in warm light",
        "looks": "Dim Edison bulbs, dark wooden tables, exposed brick",
        "atmosphere": "Smoky warmth, low conversation", "mood": "Cozy"
      }]
    }]
  }]
}
\`\`\`

**Input**: "A cave with stairs to the left and alien machine to the right"
\`\`\`json
{
  "host": {"type": "host", "name": "Underground Complex", "description": "Subterranean network"},
  "regions": [{
    "type": "region", "name": "Deep Caverns", "description": "Ancient cave system",
    "locations": [{
      "type": "location", "name": "The Vault Cave", "description": "Large chamber housing artifacts",
      "looks": "Rough stone walls, natural formation", "atmosphere": "Cool air, mechanical hum", "mood": "Mysterious",
      "niches": [{
        "type": "niche", "name": "The Echoing Vault", "description": "Chamber where stairs meet technology",
        "looks": "Stone stairway left, alien machine with glowing panels right",
        "atmosphere": "Echoing footsteps, low hum", "mood": "Enigmatic"
      }]
    }]
  }]
}
\`\`\`

## OUTPUT

Pure JSON only. No markdown fences. No explanations.
Validate: Region ≠ Host name, no empty descriptions.

## INPUT

${userPrompt}`;
}
