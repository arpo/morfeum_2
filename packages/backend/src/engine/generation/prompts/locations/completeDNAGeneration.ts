/**
 * Complete DNA Generation Prompt
 * 
 * Generates DNA for entire hierarchy in ONE LLM call.
 * Uses centralized DNA schema for consistency.
 */

import { buildDNAFieldsString } from '../shared/dnaSchema';

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

  return `Generate complete nodes with DNA for an entire location hierarchy in ONE response.

USER INPUT:
${originalPrompt}

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

2. **Architectural Consistency**:
   - architectural_tone is THE PRIMARY DRIVER of all architectural details
   - BE DETAILED: "decaying Victorian grandeur with ornate Gothic arches, weathered columns"
   - NOT: "decaying grandeur" (too sparse)

3. **Genre Inheritance**:
   - ONLY set "genre" in host DNA
   - All children: "genre": null

4. **Cascading Sparsity**:
   - Scene fields: ALWAYS populated
   - Cascading fields: null if same as parent
   - Host: ALL cascading fields required
   - Regions: 60-80% cascading fields populated
   - Locations: 40-60% cascading fields populated

5. **navigableElements - CRITICAL for locations**:
   - Types: door, passage, stairs, portal, window, bridge, path, gate
   - Include position (left, center, right, background, etc.)

6. **Output Format**:
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
