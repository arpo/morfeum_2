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
  return `You are a spatial hierarchy analyzer. Analyze user input and organize it into a 4-layer hierarchy.

## ⚠️ MINIMAL BY DEFAULT

**MOST IMPORTANT RULE: Create ONLY what is explicitly mentioned.**

- Simple phrase/description → **Host only**
- Explicit hierarchy → Parse as stated
- Vague/atmospheric description → **Host only**

**Examples:**
✅ "Göteborg inspired by Tron" → Host only
✅ "Paris" → Host only
✅ "Camden in London" → Host + Region
✅ "A pub in Camden in London" → Host + Region + Location
❌ "Göteborg inspired by Tron" → Host + Regions + Locations (WRONG!)

## 4-LAYER SYSTEM

| Layer        | Function                                    | Examples |
| ------------ | ------------------------------------------- | -------- |
| **Host**     | Broad setting; defines laws, tone, culture  | Neo-Paris, The Shire, London |
| **Region**   | Distinct district or biome within the world | Camden District, Glass Quarter |
| **Location** | Specific site that can be entered           | The Gilded Bar, Solar Dome |
| **Niche**    | Smaller space within a location             | VIP room, kitchen, storage closet |

## PARSING RULES

**Create a node when:**
- Explicit markers: "Name: Metropolis (world)", "Camden (region)", "Pub (location)"
- Section headers: "---- Locations", "---- Regions" followed by list
- Hierarchical phrase: "X in Y in Z" structure or similar like "inside", "within", "at", "on"

**Treat as description (NOT a node):**
- Prose paragraphs about atmosphere, culture, design
- Atmospheric details: "Golden hour light", "Ocean breeze"
- General qualities: "Modern skyscrapers", "Street art"

**Hierarchical pattern parsing:**
- "Glass on table in VIP room in club in Camden in London"
  - Parse innermost to outermost: Niche → Location → Region → Host

## INFERENCE RULES

**Rule 1: Simple phrase → Host only**
- "Paris" → Host only
- "Göteborg inspired by Tron" → Host only

**Rule 2: Famous landmark → Host + Location (minimal)**
- "Eiffel Tower" → Host (Paris) + Location (Eiffel Tower)

**Rule 3: Hierarchical phrase → Parse structure**
- "Camden in London" → Host (London) + Region (Camden)
- "Pub in Camden in London" → Host (London) + Region (Camden) + Location (Pub)

**Rule 4: Interior/Inside detection**
- "inside pub in Camden" → Host + Region + Location (pub) + Niche (interior)
- "Pub (interior)" → Host + Region + Location with interior description

**Keep minimal unless:**
- Different vibes warrant multiple regions (Financial District vs Arts District)
- Explicitly mentioned distinct areas

## NESTING STRUCTURE

**CRITICAL: Each layer MUST nest INSIDE its parent.**

✅ **Correct:**
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
        "name": "Pub",
        "description": "...",
        "niches": [{
          "type": "niche",
          "name": "VIP Room",
          "description": "..."
        }]
      }]
    }]
  }
}
\`\`\`

## VISUAL ENRICHMENT FOR DEEPEST NODE

**IMPORTANT: The DEEPEST node (most specific layer) must include visual enrichment:**

- **name**: Use mentioned name OR invent memorable one
  - Examples: "The Whispering Archives", "Neon Sanctum", "Forgotten Shore", "The Iron Tide"
  - Avoid generic: "Bar", "Club", "Room"
  
- **description**: 2-3 sentences explaining what it is

- **looks**: Visible geometry, layout, scale. Key shapes, surfaces, spatial focus. Visual and concrete.

- **atmosphere**: Air and motion: still, windy, hazy, clear. Temperature/humidity only if distinctive.

- **mood**: Concise emotional tone (tense, serene, lonely, electric).

**Example deepest node:**
{
  "type": "location",
  "name": "The Rusted Anchor",
  "description": "A drinking establishment frequented by dockworkers and sailors",
  "looks": "Industrial brick walls, weathered copper bar counter, ship porthole windows, Edison bulbs",
  "atmosphere": "Hazy with smoke, still air, warm amber lighting, smell of salt and beer",
  "mood": "Relaxed yet edgy, working-class authenticity"
}

**Parent nodes (Host, Region) do NOT need visual fields - only type, name, description.**

## OUTPUT FORMAT

**Output ONLY pure JSON. No markdown fences, no explanation.**

**Minimal (Host only):**
\`\`\`json
{
  "host": {
    "type": "host",
    "name": "Göteborg (Tron-inspired)",
    "description": "A futuristic, neon-drenched interpretation of Göteborg."
  }
}
\`\`\`

**Explicit hierarchy:**
\`\`\`json
{
  "host": {
    "type": "host",
    "name": "London",
    "description": "A vibrant coastal city.",
    "regions": [{
      "type": "region",
      "name": "Camden",
      "description": "Industrial district with emerging nightlife.",
      "locations": [{
        "type": "location",
        "name": "Techno Club",
        "description": "Pulsating electronic music venue.",
        "niches": [{
          "type": "niche",
          "name": "VIP Room",
          "description": "Exclusive lounge with plush seating."
        }]
      }]
    }]
  }
}
\`\`\`

## VALIDATION

- All names must be meaningful strings (not empty, not generic)
- Descriptions must be 2-3 sentences if its a real place mention its name.
- Type field required: "host", "region", "location", "niche"
- Don't create empty arrays - only include nested layers if they exist
- Infer sensibly when information is implicit

## USER INPUT

${userPrompt}`;
}
