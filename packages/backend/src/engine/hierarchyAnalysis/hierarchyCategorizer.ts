/**
 * Hierarchy Categorizer Prompt
 * 
 * Analyzes user input and categorizes it into a 5-layer hierarchy:
 * Host → Region → Location → Niche → Detail
 */

export function buildHierarchyCategorizerPrompt(userPrompt: string): string {
  return `You are a spatial hierarchy analyzer. Your task is to analyze user descriptions and organize them into a structured 5-layer hierarchy.

## THE 5-LAYER SYSTEM

| Layer        | Example          | Function                                              |
| ------------ | ---------------- | ----------------------------------------------------- |
| **Host**     | *London*       | Governs tone, culture, light rhythm, social logic.    |
| **Region**   | *Camden*         | Defines sub-culture or biome, local climate and mood. |
| **Location** | *Techno club*    | Specific place of activity or architecture.           |
| **Niche**    | *VIP niche*      | Micro-environment, interior or exterior focus zone.   |
| **Detail**   | *Glass on table* | **SPECIFIC OBJECT ONLY** - Not environmental qualities! |

### CRITICAL: Detail Layer Rules
**ONLY create Detail nodes when the user explicitly marks them with (detail)**

**Examples:**
- ✅ "A key in the secret chamber (detail)" → Create Detail node
- ✅ "A broken clock on the wall (detail)" → Create Detail node  
- ❌ "A glass on the table" → Do NOT create Detail (no marker)
- ❌ "Nature is reclaiming the space" → Do NOT create Detail (no marker)

**If an object or element is NOT marked with (detail), include it in the parent node's description instead.**

This prevents over-categorization and keeps the hierarchy clean. Users must explicitly request Detail nodes by adding the (detail) marker.

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
- Example: "Glass on table in VIP room in club in Camden in London"
  - Detail: Glass on table
  - Niche: VIP room
  - Location: Club
  - Region: Camden
  - Host: London

### Rule 4: Multiple Attractions in Same City
- Create separate regions for distinct vibes/districts
- Example: "Botanical Dome and Halo Spire in Metropolis"
  - Host: Metropolis
  - Region 1: Botanical District → Location: Botanical Dome
  - Region 2: Financial District → Location: Halo Spire

### Rule 5: Complex Description
- Extract all mentioned layers
- Create hierarchy based on spatial relationships
- Infer missing layers when obvious
- Multiple locations under same region if they share vibe/district

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
