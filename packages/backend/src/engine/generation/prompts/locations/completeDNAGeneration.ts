/**
 * Complete DNA Generation Prompt
 * 
 * Generates DNA for entire hierarchy in ONE LLM call.
 * Uses centralized DNA schema for consistency.
 */

import { buildDNAFieldsString } from '../shared/dnaSchema';
import { buildLocationNamingGuidelines } from '../shared/namingGuidelines';

/**
 * Generate complete DNA for entire hierarchy in ONE LLM call
 */
export function completeDNAGeneration(
  originalPrompt: string,
  hostName: string,
  hostDescription: string,
  regions: Array<{
    name: string;
    description: string;
    locations?: Array<{
      name: string;
      description: string;
      niches?: Array<{ name: string; description: string }>;
    }>;
  }>,
  visualAnalysis?: any
): string {
  const visualAnalysisSection = visualAnalysis ? buildVisualAnalysisSection(visualAnalysis) : '';

  const hierarchySection = regions.map(region => `
REGION: ${region.name}
Description: ${region.description}
${region.locations ? region.locations.map(loc => `
  LOCATION: ${loc.name}
  Description: ${loc.description}
  ${loc.niches ? loc.niches.map(niche => `
    NICHE: ${niche.name}
    Description: ${niche.description}`).join('') : ''}`).join('') : ''}`).join('');

  // Build DNA templates using centralized schema
  const hostDNAFields = buildDNAFieldsString({ includeStructure: false, genreHandling: 'host', nodeType: 'host' });
  const regionDNAFields = buildDNAFieldsString({ includeStructure: false, genreHandling: 'null', nodeType: 'region' });
  const locationDNAFields = buildDNAFieldsString({ includeStructure: true, genreHandling: 'null', nodeType: 'location' });
  const namingGuidelines = buildLocationNamingGuidelines();

  return `Generate complete nodes with DNA for an entire location hierarchy in ONE response.

USER INPUT:
${originalPrompt}

${namingGuidelines}

HIERARCHY DEFINITIONS & ZOOM LEVELS:

1. 🌍 **HOST (The World/Realm)**
   - **Scope**: The entire world, environment, or setting from above.
   - **Perspective**: **SATELLITE / MAP VIEW**. Seen from extreme altitude.
   - **Defines**: Overall layout, major zones, terrain patterns, and environmental identity.
   - **NEVER describe**: Individual structures, specific sites, or small details.
   - **Metaphor**: "The Map" or "The Overview".
   - **Urban Example**: "A sprawling coastal metropolis with clusters of skyscrapers along the waterfront."
   - **Natural Example**: "An ancient forest of towering redwoods stretching across misty mountain valleys."
   - **Fantasy Example**: "A floating archipelago of crystalline islands suspended above an endless void."
   - **Sci-Fi Example**: "A massive asteroid habitat with domed settlements scattered across its rocky surface."

2. 🏞️ **REGION (The Zone/Biome)**
   - **Scope**: A broad area, district, or biome within the Host.
   - **Perspective**: **AERIAL / OVERVIEW**. Seen from above or a distance.
   - **Defines**: Local climate, weather patterns, terrain variations, and specific mood shifts.
   - **Metaphor**: "The Chapter" or "The Biome".
   - **Urban Example**: "Northern industrial district with smokestacks and warehouses."
   - **Natural Example**: "Northern cliffs dominated by perpetual blizzards and ice caves."
   - **Fantasy Example**: "The Shimmering Glade where bioluminescent flora casts an eternal twilight."

3. 🏛️ **LOCATION (The Specific Site)**
   - **Scope**: An exact, explorable place (building, clearing, cave, platform).
   - **Perspective**: **GROUND LEVEL / HUMAN SCALE**. Seen from standing height.
   - **Defines**: Specific features, immediate surroundings, detailed materials, and local lighting.
   - **Metaphor**: "The Stage" or "The Set".
   - **Urban Example**: "A weathered brick warehouse with rusted loading doors."
   - **Natural Example**: "A moss-covered clearing with ancient standing stones."
   - **Fantasy Example**: "A crystalline spire with spiraling ramps leading to an observation deck."

HIERARCHY STRUCTURE:

HOST: ${hostName}
Description: ${hostDescription}
${hierarchySection}
${visualAnalysisSection}

OUTPUT JSON STRUCTURE:

{
  "host": {
    "name": "Host Name",
    "description": "Host description",
    "navigableElements": [],
    "dominantElements": ["Major landmarks"],
    "uniqueIdentifiers": ["Unique features"],
    "searchDesc": "75-100 char description",
    "slug": "kebab-case-name",
    "dna": {${hostDNAFields}
    }
  },
  "regions": [
    {
      "name": "Region Name",
      "description": "Region description",
      "navigableElements": [],
      "dominantElements": ["Regional landmarks"],
      "uniqueIdentifiers": ["Regional features"],
      "searchDesc": "75-100 char description",
      "slug": "kebab-case-name",
      "dna": {${regionDNAFields}
      }
    }
  ],
  "locations": [
    {
      "regionName": "Which region this belongs to",
      "name": "Location Name",
      "description": "Location description",
      "navigableElements": [{"type": "door|passage|stairs", "position": "location in scene", "description": "what it is"}],
      "dominantElements": ["Major features"],
      "uniqueIdentifiers": ["Distinctive features"],
      "searchDesc": "75-100 char description",
      "slug": "kebab-case-name",
      "dna": {${locationDNAFields}
      }
    }
  ]
}

CRITICAL GUIDELINES:

1. **JSON NULL vs STRING "null"**:
   - ALWAYS use actual JSON null, NEVER the string "null"
   - ❌ WRONG: "cultural_tone": "null"
   - ✓ CORRECT: "cultural_tone": null

2. **Zoom Level & Perspective Enforcement**:
   - **HOST**: Must describe the *entire world/environment* from a **MAP/SATELLITE** perspective.
     - **PLURALITY RULE**: Use **PLURAL** forms appropriate to the environment type:
       - Urban: "buildings", "districts", "neighborhoods", "streets", "towers"
       - Natural: "forests", "mountains", "valleys", "rivers", "meadows"
       - Fantasy: "floating islands", "crystal spires", "enchanted groves"
       - Sci-Fi: "domes", "modules", "habitats", "platforms", "sectors"
     - ❌ NEVER: "A single tree", "The house has", "A building with", "One cave"
     - ✅ ALWAYS: "Vast expanses of...", "Clusters of...", "Networks of...", "Scattered formations of..."
     - ❌ Bad Host: "A two-story structure with wooden accents." (This describes a Location!)
     - ✅ Good Host (Urban): "A hillside town with terracotta rooftops cascading down to the sea."
     - ✅ Good Host (Natural): "Dense rainforest canopy stretching to distant volcanic peaks."
     - ✅ Good Host (Fantasy): "Floating islands connected by luminous bridges over an endless abyss."
   - **REGION**: Must describe a *broad area/zone* from an **OVERVIEW/AERIAL** perspective.
     - **PLURALITY RULE**: Describe the **COLLECTIVE** features and atmosphere. Use **PLURAL** forms appropriate to the environment.
     - Focus on the *layout*, *terrain*, *atmosphere*, and *patterns* of the zone.
   - **LOCATION**: Must describe a *specific site* from a **GROUND-LEVEL** perspective.
     - Describe the *specific* place the user is visiting.
   - **Differentiation**: A Region is NOT a Location. A Region is the *container* for Locations.
     - ❌ Bad Region: "A small wooden shack." (Too specific, this is a Location)
     - ✅ Good Region: "A dense, fog-shrouded forest of ancient pines." (A biome)
     - ❌ Bad Location: "The entire northern hemisphere." (Too broad, this is a Region)
     - ✅ Good Location: "The moss-covered ruins of a stone watchtower." (A specific site)

3. **Real Place Enforcement**:
   - **DETECT REAL PLACES**: If the user input describes a real-world place (e.g., "Burning Man", "Tokyo", "The Louvre"), you MUST incorporate specific, accurate details from that place.
   - **NO GENERIC TROPES**: Do not default to generic sci-fi/fantasy descriptions if a real place is implied. Use the real materials, atmosphere, and cultural context of the referenced place.

4. **Contextual Consistency & Structure**:
   - **REGION SETTING**: The Region must provide a logical setting for its Locations. If a Location is a "round house", the Region should describe a landscape or settlement pattern that supports this (e.g., "rolling hills dotted with circular dwellings"), NOT a conflicting style (e.g., "square concrete blocks").
   - **LOCATION STRUCTURE**: You MUST populate the \`structure\` object for Locations with specific details:
     - \`form\`: organic, geometric, amorphous, etc.
     - \`roofType\`: domed, flat, pitched, open-sky, etc.
     - \`scale\`: intimate, massive, towering, etc.
     - \`orientation\`: vertical, horizontal, sprawling, etc.
     - \`openings\`: narrow-slits, large-glass, open-air, etc.
   - **ARCHITECTURAL TONE**: This is THE PRIMARY DRIVER. Be detailed: "decaying Victorian grandeur with ornate Gothic arches" (NOT just "decaying grandeur").

5. **Genre Inheritance**:
   - ONLY set "genre" in host DNA
   - All children: "genre": null

6. **Cascading Sparsity**:
   - Scene fields: ALWAYS populated
   - Cascading fields: null if same as parent
   - Host: ALL cascading fields required
   - Regions: 60-80% cascading fields populated
   - Locations: 40-60% cascading fields populated

7. **navigableElements - CRITICAL for locations**:
   - Types: door, passage, stairs, portal, window, bridge, path, gate
   - Include position (left, center, right, background, etc.)

8. **Output Format**:
   - Pure JSON only - no markdown, code fences, or comments

Generate now:`;
}

/**
 * Build visual analysis section for context
 */
function buildVisualAnalysisSection(visualAnalysis: any): string {
  return `
VISUAL ANALYSIS OF DEEPEST NODE (Work Backwards From This):

Looks: ${visualAnalysis.looks || 'N/A'}
Atmosphere: ${visualAnalysis.atmosphere || 'N/A'}
Lighting: ${visualAnalysis.lighting || 'N/A'}
Materials: ${visualAnalysis.materials_primary || 'N/A'}
Colors: ${visualAnalysis.colors_dominant || 'N/A'}

Use these details to INFER parent node styles.
Example: "polished chrome walls" → Host architectural_tone: "industrial metallic aesthetic"
`;
}
