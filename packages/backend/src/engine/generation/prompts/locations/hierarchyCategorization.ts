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

## 🚨🚨🚨 STEP 1: PRE-FLIGHT CHECK - READ THIS FIRST 🚨🚨🚨

**BEFORE DOING ANYTHING ELSE, CHECK FOR THIS PATTERN:**

Pattern: "[thing] [preposition] [WORD] in [WORD]"

Where [preposition] can be: **in, on, at, by, near, within, beside, around**

If you find this pattern:
- Second WORD (rightmost, after "in") = Host
- First WORD (middle, after preposition) = Region  
- Thing (leftmost) = Location

EXAMPLES OF THIS CRITICAL PATTERN:
"club in Camden in London" → Host: London, Region: Camden, Location: club
"bar on Ringön in Göteborg" → Host: Göteborg, Region: Ringön, Location: bar
"bar at Shibuya in Tokyo" → Host: Tokyo, Region: Shibuya, Location: bar
"pub by SoHo in New York" → Host: New York, Region: SoHo, Location: pub
"cafe near Montmartre in Paris" → Host: Paris, Region: Montmartre, Location: cafe

❌ WRONG (DO NOT DO THIS):
{
  "host": {"name": "Göteborg"},
  "regions": [{"name": "Göteborg", "description": ""}]  ← Passthrough region (WRONG!)
}

✅ CORRECT:
{
  "host": {"name": "Göteborg"},
  "regions": [{"name": "Ringön", "description": "Industrial island district"}]  ← District extracted!
}

If this pattern exists, YOU MUST extract the middle word as a Region. NO EXCEPTIONS.
The Region name must NEVER be the same as the Host name.

## ⚠️ MINIMAL BY DEFAULT

**MOST IMPORTANT RULE: Create ONLY what is explicitly mentioned.**

- Simple phrase/description → **Host only**
- Explicit hierarchy → Parse as stated
- Vague/atmospheric description → **Host only**

**Examples:**
✅ "London inspired by Tron" → Host only
✅ "Paris" → Host only
✅ "Camden in London" → Host + Region
✅ "A pub in Camden in London" → Host + Region + Location
❌ "London inspired by Tron" → Host + Regions + Locations (WRONG!)

## 4-LAYER SYSTEM

| Layer        | Function                                    | Examples |
| ------------ | ------------------------------------------- | -------- |
| **Host**     | Broad setting; defines laws, tone, culture  | Neo-Paris, The Shire, London |
| **Region**   | Distinct district or biome within the world | Camden District, Glass Quarter |
| **Location** | Specific site that can be entered           | The Gilded Bar, Solar Dome |
| **Niche**    | Smaller space within a location             | VIP room, kitchen, storage closet |

## NICHE CREATION RULES

**⚠️ CRITICAL: Niches are ONLY for distinct smaller PHYSICAL SPACES, not environmental descriptions.**

**✅ CREATE NICHE When:**
- "A control room inside the biodome" → Separate enclosed space
- "Hidden chamber beneath the lighthouse" → Distinct sub-room
- "VIP section behind velvet curtain" → Physically separated area
- "The bar's back office" → Enclosed separate room
- **Test: Can you physically walk from the main space INTO a distinct separate area?** YES → Create niche

**❌ DO NOT Create Niche For:**
- "The biodome's interior is lush" → Use location's looks/atmosphere fields
- "Inside the bar it's smoky" → Use location's atmosphere field
- "The room is warm and humid" → Environmental quality, use atmosphere
- "The space is filled with vegetation" → Visual description, use looks
- **Test: Is this describing the ENVIRONMENT of the main space?** YES → Use visual enrichment, NOT a niche

**Examples:**

**Example A - NO Niche (Environmental Description):**
Input: "A crystalline biodome, its interior lush and humid"
✅ Correct:
{
  "location": {
    "type": "location",
    "name": "The Glass Womb",
    "description": "A crystalline biodome on a forgotten planet",
    "looks": "Vast crystalline dome structure, lush vegetation filling interior, alien flora throughout",
    "atmosphere": "Humid and warm, circulating airflow, scent of damp earth and exotic blossoms",
    "mood": "Serene, ancient, hauntingly beautiful"
  }
}

**Example B - YES Niche (Distinct Physical Space):**
Input: "A biodome with a hidden control room"
✅ Correct:
{
  "location": {
    "type": "location",
    "name": "The Glass Womb",
    "description": "Crystalline biodome exterior"
  },
  "niches": [{
    "type": "niche",
    "name": "Control Room",
    "description": "Hidden control chamber beneath the main dome"
  }]
}

## PARSING RULES

**Create a node when:**
- Explicit markers: "Name: Metropolis (world)", "Camden (region)", "Pub (location)"
- Section headers: "---- Locations", "---- Regions" followed by list
- Hierarchical phrase: "X in Y in Z" structure or similar like "inside", "within", "at", "on"
- **District/neighborhood names: ALWAYS extract as Region**

**Treat as description (NOT a node):**
- Prose paragraphs about atmosphere, culture, design
- Atmospheric details: "Golden hour light", "Ocean breeze"
- General qualities: "Modern skyscrapers", "Street art"

**Hierarchical pattern parsing:**
- "Glass on table in VIP room in club in Camden in London"
  - Parse innermost to outermost: Niche → Location → Region → Host

## INFERENCE RULES

**Rule 0: Specific Structure Detection → Create Location with Inferred Host**

**🔍 STRUCTURE KEYWORDS indicate a Location, NOT a Host:**

**Buildings:** greenhouse, tower, shop, bar, pub, club, restaurant, cafe, temple, church, cathedral, observatory, lighthouse, dome, warehouse, factory, bunker, station, terminal, hangar, library, museum, theater, arena, stadium

**Structures:** bridge, fountain, monument, statue, gate, wall, archway, obelisk, pavilion, gazebo

**Natural Features:** cave, cavern, grotto, waterfall, grove, clearing, crater, canyon, ravine, valley, peak, summit

**When STRUCTURE KEYWORD detected:**
1. The named structure becomes a **Location**
2. **Infer a Host** from thematic context in the description
3. Optionally infer Region if strong regional cues present

**Examples:**

✅ "The Ferro Garden, an abandoned greenhouse where metallic plants bloom"
Example output:
{
  "host": {
    "type": "host",
    "name": "The Rusted Realm",
    "description": "A world where nature and metal intertwine, where metallic flora responds to electrical storms."
  },
  "regions": [{
    "type": "region", 
    "name": "The Storm Territories",
    "description": "A region frequently struck by thunderstorms that awaken the metallic vegetation.",
    "locations": [{
      "type": "location",
      "name": "The Ferro Garden",
      "description": "An abandoned greenhouse where metallic plants coil and bloom when thunder rolls.",
      "looks": "Decaying glass panes, rusted metal frames, strange metallic flora coiling around support beams",
      "atmosphere": "Damp, echoing, occasionally charged with static electricity during storms",
      "mood": "Eerie, desolate, strangely vibrant"
    }]
  }]
}

✅ "The Crystal Spire, a tower reaching into the clouds"
Example output:
{
  "host": {
    "type": "host",
    "name": "Celestial Heights",
    "description": "A world of floating islands and cloud-piercing structures."
  },
  "regions": [{
    "type": "region",
    "name": "The Upper Reaches", 
    "description": "The highest elevations where structures breach the cloud layer.",
    "locations": [{
      "type": "location",
      "name": "The Crystal Spire",
      "description": "A magnificent tower reaching through the clouds into the clear sky above.",
      "looks": "Gleaming crystalline structure, geometric facets catching sunlight, cloud layer swirling around base",
      "atmosphere": "Thin air, wispy clouds passing by, crystal surfaces resonating with wind",
      "mood": "Majestic, isolated, ethereal"
    }]
  }]
}

✅ "A bar in Tokyo"
- "bar" = structure keyword → Location
- "Tokyo" = city name → Host
- Result: Host (Tokyo) + Location (Bar)

**Rule 1: Simple phrase → Host only (IF NO STRUCTURE KEYWORD)**
- "Paris" → Host only
- "London inspired by Tron" → Host only
- "A cyberpunk world" → Host only

**Rule 2: Famous landmark → Host + Location (minimal)**
- "Eiffel Tower" → Host (Paris) + Location (Eiffel Tower)

**Rule 3: Hierarchical phrase → Parse structure**
- "Camden in London" → Host (London) + Region (Camden)
- "Pub in Camden in London" → Host (London) + Region (Camden) + Location (Pub)

**Rule 4: Interior/Inside detection**
- "Bar at Camden in London" → Host + Region + **Location** (gets exterior shot)
- "Inside bar at Camden in London" → Host + Region + Location (bar) + **Niche** (interior, gets interior shot)
- "Pub (interior)" → Host + Region + Location + Niche with interior description

**Key: Location = EXTERIOR by default. Add "inside" to create Niche = INTERIOR.**

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

- **name**: Use mentioned name OR invent memorable, evocative one
  - Be creative - the name should reflect the PLACE DESCRIBED, not the inspiration source
  - If location is inspired by an artist or similar, DO NOT mention the inspiration source in the name
  - Alien/exotic places can use alien language names or poetic descriptors
  - Examples:
    - "The Whispering Archives" (not "Borges-inspired Library")
    - "Neon Sanctum" (not "Blade Runner-style Club")
    - "The Crystalline Expanse" (not "Moebius-inspired Desert")
    - "Zyx'thara Prime" (alien world name)
    - "The Singing Bridges" (focuses on the feature, not the artist)
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
  "atmosphere": "Hazy with smoke, still air, warm ambient lighting, smell of salt and beer",
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
    "name": "London (Tron-inspired)",
    "description": "A futuristic, neon-drenched interpretation of London."
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

## 🚨 STEP 2: BEFORE OUTPUT - FINAL VALIDATION 🚨

**RUN THESE CHECKS BEFORE OUTPUTTING:**

1. **Spatial Pattern Check**: Does input match "[thing] [preposition] [WORD] in [WORD]"?
   - Where preposition = in, on, at, by, near, within, beside, around
   - YES → Is middle WORD (after preposition, before "in") extracted as Region?
   - If NO → STOP and fix. Middle word MUST be a Region with meaningful description.

2. **Passthrough Region Check**: Is any Region name identical to Host name?
   - YES → This is a CRITICAL ERROR. You missed extracting the actual region/district.
   - Check the user input again for district, neighborhood, or area names.
   - The Region name MUST be different from the Host name.
   - NO → Continue.

3. **Empty Description Check**: Does any Region have an empty or missing description?
   - YES → This is an ERROR. All Regions must have meaningful 1-2 sentence descriptions.
   - NO → Continue.

4. **Specific Examples Check**: 
   - "Camden" and "London" → Region MUST be "Camden", NOT "London"
   - "Ringön" and "Göteborg" → Region MUST be "Ringön", NOT "Göteborg"
   - "Shibuya" and "Tokyo" → Region MUST be "Shibuya", NOT "Tokyo"
   - "SoHo" and "New York" → Region MUST be "SoHo", NOT "New York"

## VALIDATION

- All names must be meaningful strings (not empty, not generic)
- Descriptions must be 2-3 sentences if its a real place mention its name.
- Type field required: "host", "region", "location", "niche"
- Don't create empty arrays - only include nested layers if they exist
- Infer sensibly when information is implicit

## USER INPUT

${userPrompt}`;
}
