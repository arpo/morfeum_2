/**
 * Hierarchy Categorizer Prompt
 * 
 * Analyzes user input and categorizes it into a 5-layer hierarchy:
 * Host → Region → Location → Niche → Detail
 */

export function buildHierarchyCategorizerPrompt(userPrompt: string): string {
  return `You are a spatial hierarchy analyzer. Your task is to analyze user descriptions and organize them into a structured 5-layer hierarchy.

## THE 5-LAYER SYSTEM

| Layer        | Function                                              |
| ------------ | ----------------------------------------------------- |
| **Host**     | Broad setting; defines laws, tone, culture            |
| **Region**   | A distinct district or biome within the world         |
| **Location** | Specific site that can be entered or explored         |
| **Niche**    | A smaller location within a location                   |
| **Detail**   | Smaller specific object (only when marked with "(detail)")    |

### Layer Examples

**Host (World)**
- "Neo-Paris, a luminous megacity rebuilt after the Flood."
- "The Shire, a pastoral valley of green hills and round doors."
- "Erebus-9, a mining moon wrapped in perpetual night."
- "Old London, smog-choked capital of empire and invention."
- "Auralis Prime, an ocean world where sound shapes matter."

**Region**
- "Camden District, a maze of canals, markets, and music clubs."
- "The Glass Quarter, a high-rise sector of mirrored towers."
- "Verdant Basin, humid lowlands beneath floating gardens."
- "Rust Docks, the city's decaying industrial shoreline."
- "The Northern Sprawl, a frozen expanse of concrete and wind."

**Location**
- "The Gilded Bar, where holographic jazz flickers against smoke."
- "The Solar Dome, a vast botanical sphere of filtered sunlight."
- "Reactor 12, its core pulsing with unstable blue light."
- "The Abandoned Starliner Aurelion, half-buried in tidal mud."
- "The Lantern Bazaar, an underground market lit by bioluminescent stalls."

**Niche**
- VIP room in a nightclub, lined with velvet seats and low amber light.
-Secret room in the basement, hidden behind loose paneling and humming pipes.
- Toilet in a restaurant, tiled, echoing, with a single flickering bulb.
- Kitchen behind the café counter, steam rising over clattering pans.
- Storage closet in the museum, stacked with forgotten display cases.

**Detail (only with explicit marker)**
- "A silver key on the captain's desk (detail)"
- "The broken clock frozen at 3:47 (detail)"
- "A glass of amber liquid on the bar (detail)"

### CRITICAL: Detail Layer Rules
**ONLY create Detail nodes when the user explicitly marks them with (detail)**

**Examples:**
- ✅ "A key in the secret chamber (detail)" → Create Detail node
- ✅ "A broken clock on the wall (detail)" → Create Detail node  
- ❌ "A glass on the table" → Do NOT create Detail (no marker)
- ❌ "Nature is reclaiming the space" → Do NOT create Detail (no marker)

**If an object or element is NOT marked with (detail), include it in the parent node's description instead.**

This prevents over-categorization and keeps the hierarchy clean. Users must explicitly request Detail nodes by adding the (detail) marker.

## PARSING RULES: Structured Input vs. Descriptive Prose

**CRITICAL: Distinguish between explicit nodes and descriptive text**

### What Creates a Node:
1. **Explicit markers**: "Name: Metropolis (world)", "Solar Dome (location)"
2. **Section headers**: "---- Locations", "---- Regions" followed by list items
3. **Clear hierarchical phrases**: "X in Y in Z" structure

### What is Description (NOT a node):
1. **Prose paragraphs**: Long descriptive text about atmosphere, culture, design
2. **Atmospheric details**: "Golden hour light", "Bioluminescent plants", "Ocean breeze"
3. **General qualities**: "Modern skyscrapers", "Old European buildings", "Street art"

**EXAMPLE OF CORRECT PARSING:**

Input:
Name: Metropolis (world)
A sprawling coastal metropolis with sleek modern skyscrapers and old European buildings. The city stretches along the coastline where golden hour light bathes everything. Pedestrian skybridges connect cafes and museums. The ocean breeze carries saltwater scent.
---- Locations
Famous Botanical Dome (location) - A vast glass dome filled with tropical greenery.

Correct Output:
Host: Metropolis (with full description paragraph)
Region: Central District (inferred)
Location: Famous Botanical Dome

**WRONG: Creating separate regions from prose like "Coastal Front", "Historic Heart", "Architectural Showcase" etc.**
The prose describes the host world, not separate regions. Only create regions when explicitly listed or clearly distinct districts are mentioned.

## INFERENCE RULES

### Rule 1: Single Word Input (e.g., "Paris")
- Create Host only
- Infer description from world knowledge
- Output: { host: { name: "Paris", description: "..." } }

### Rule 2: Famous Landmark (e.g., "Eiffel Tower")
- Infer Host from world knowledge (Paris)
- Create Region if landmark has distinct district
- Create Location for the landmark itself
- Output: { host: { regions: [{ locations: [...] }] } }

### Rule 3: Hierarchical Pattern (e.g., "X in Y in Z")
- Parse hierarchy from innermost to outermost
- Example: "Glass (detail) on table in VIP room in club in Camden in London"
  - Detail: Glass (only if marked with "(detail)")
  - Niche: VIP room
  - Location: Club
  - Region: Camden
  - Host: London

### Rule 4: Structured Lists After Section Headers
- Look for headers like "---- Locations", "---- Regions", "#### Niches"
- Items following these headers become nodes
- Everything else is descriptive prose

### Rule 5: Complex Description with Explicit Nodes
- Extract ONLY explicitly marked nodes
- Use prose as description for Host/Region/Location
- Infer minimal regions when locations are listed without regions
- Multiple locations can share one inferred region if they have similar vibes

## REGION INFERENCE GUIDELINES

Create multiple regions when:
- Different cultural vibes (Financial District vs Arts District)
- Different functions (Industrial vs Residential)
- Different atmospheres (Nightlife Zone vs Museum Quarter)
- Explicitly mentioned (North Side, South Side)

Keep single region when:
- Locations share same vibe/purpose
- No distinct district mentioned
- All locations are similar types

## OUTPUT FORMAT

**CRITICAL: Output ONLY pure JSON. No markdown fences, no explanation text, no comments.**

Structure based on what exists in input:

**Minimal (Host only):**
\`\`\`json
{
  "host": {
    "type": "host",
    "name": "Paris",
    "description": "The capital city of France, known for art, fashion, and culture."
  }
}
\`\`\`

**Full Hierarchy:**
\`\`\`json
{
  "host": {
    "type": "host",
    "name": "London",
    "description": "A vibrant coastal city in Sweden.",
    "regions": [{
      "type": "region",
      "name": "Camden",
      "description": "An industrial district with emerging nightlife.",
      "locations": [{
        "type": "location",
        "name": "Techno Club",
        "description": "A pulsating electronic music venue with underground atmosphere.",
        "niches": [{
          "type": "niche",
          "name": "VIP Room",
          "description": "An exclusive lounge area with plush seating.",
          "details": [{
            "type": "detail",
            "name": "Glass on Table",
            "description": "A drink resting on the polished table surface."
          }]
        }]
      }]
    }]
  }
}
\`\`\`

**Multiple Regions:**
\`\`\`json
{
  "host": {
    "type": "host",
    "name": "Metropolis",
    "description": "A sprawling coastal metropolis with diverse districts.",
    "regions": [
      {
        "type": "region",
        "name": "Botanical District",
        "description": "Known for lush greenery and botanical wonders.",
        "locations": [{
          "type": "location",
          "name": "Famous Botanical Dome",
          "description": "A vast glass dome filled with tropical greenery and exotic flowers."
        }]
      },
      {
        "type": "region",
        "name": "Financial District",
        "description": "The bustling heart of commerce and innovation.",
        "locations": [{
          "type": "location",
          "name": "Halo Spire",
          "description": "A towering spiraling skyscraper with vertical gardens."
        }]
      }
    ]
  }
}
\`\`\`

## VALIDATION RULES

1. **All names must be meaningful strings** (not empty, not generic like "Location 1")
2. **Descriptions must be 1-3 sentences** capturing essence
3. **Type field required** for every node ("host", "region", "location", "niche", "detail")
4. **Don't create empty arrays** - only include nested layers if they exist
5. **Names should match user input** when explicitly given
6. **Infer sensibly** when information is implicit

## SPECIAL CASES

**Vague Input:** "A place"
- Create minimal host with generic name
- Add note in description about vague input

**Multiple Locations, Same Region:**
- If locations share vibe, put in same region
- Example: "Louvre and Arc de Triomphe" → Both in "Central Paris" region

**Details without Container:**
- Infer appropriate containers
- Example: "A sword" → Infer museum/display/collection location

## USER INPUT TO ANALYZE

${userPrompt}

## YOUR TASK

Analyze the input above and output the appropriate JSON hierarchy. Remember:
- Start from Host (always required)
- Add nested layers only if they exist in input or can be clearly inferred
- Use world knowledge to fill in descriptions
- Create multiple regions/locations when distinct vibes/purposes exist
- Output ONLY JSON, no explanation

ANALYZE NOW:`;
}
