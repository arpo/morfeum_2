/**
 * Complete DNA Generation Prompt
 * 
 * Generates DNA for entire hierarchy in ONE LLM call:
 * - Host (full DNA)
 * - All Regions (sparse DNA)
 * - All Locations (sparse DNA)
 * - All Niches (sparse DNA)
 * 
 * @param originalPrompt - Original user input
 * @param hierarchy - The hierarchy structure from classification
 * @returns Prompt string for LLM
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
  }>
): string {
  return `Generate complete DNA for an entire location hierarchy in ONE response.

USER INPUT:
${originalPrompt}

HIERARCHY STRUCTURE:

HOST: ${hostName}
Description: ${hostDescription}

${regions.map(region => `
REGION: ${region.name}
Description: ${region.description}
${region.locations ? region.locations.map(loc => `
  LOCATION: ${loc.name}
  Description: ${loc.description}
  ${loc.niches ? loc.niches.map(niche => `
    NICHE: ${niche.name}
    Description: ${niche.description}
  `).join('') : ''}
`).join('') : ''}
`).join('')}

OUTPUT STRUCTURE:

{
  "host": {
    // FULL DNA - all 22 fields populated
    "looks": "2-4 sentences describing what is seen",
    "colorsAndLighting": "1-3 sentences on colors and light",
    "atmosphere": "2-4 sentences on air, temperature, motion, weather",
    "architectural_tone": "10-20 char phrase (e.g. 'futuristic metal')",
    "cultural_tone": "1 sentence on social/functional identity",
    "materials": "1-3 sentences naming main materials",
    "mood": "1-2 sentences on emotional tone",
    "sounds": "5-7 words listing ambient sounds",
    "dominantElementsDescriptors": "3-5 defining objects or structures",
    "spatialLayout": "1-3 sentences on space shape, dimensions",
    "primary_surfaces": "Main materials on walls, floor, ceiling",
    "secondary_surfaces": "Supporting materials on furniture",
    "accent_features": "Decorative or striking details",
    "dominant": "Primary color family with coverage area",
    "secondary": "Secondary color and where it appears",
    "accent": "Accent colors and placement",
    "ambient": "Overall light tone (warm/cool/neutral)",
    "uniqueIdentifiers": "2-4 distinctive visual features",
    "searchDesc": "75-100 char search description"
  },
  "regions": [
    {
      "name": "Region Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from Host
        // Set to null for fields that inherit from Host
        "architectural_tone": "different style" or null,
        "cultural_tone": "different culture" or null,
        "mood": "different mood" or null,
        // ... other fields null if inheriting from Host
      }
    }
  ],
  "locations": [
    {
      "regionName": "Which region this belongs to",
      "name": "Location Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from Host + Region
        "sounds": "different sounds" or null,
        "materials": "different materials" or null,
        // ... other fields null if inheriting
      }
    }
  ],
  "niches": [
    {
      "locationName": "Which location this belongs to",
      "name": "Niche Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from parent chain
        "atmosphere": "intimate feel" or null,
        "spatialLayout": "specific layout" or null,
        // ... other fields null if inheriting
      }
    }
  ]
}

CRITICAL GUIDELINES:

1. **Host DNA**: Generate ALL 22 fields with complete descriptions
2. **Child DNA**: ONLY populate fields that are DIFFERENT from parent
   - If same as parent → set to null
   - If different → provide new value
3. **Inheritance Chain**: 
   - Regions inherit from Host
   - Locations inherit from Host + Region
   - Niches inherit from Host + Region + Location
4. **Parent References**: 
   - Locations must specify "regionName"
   - Niches must specify "locationName"
5. **Consistency**: Maintain visual coherence across hierarchy
6. **Output**: Flat JSON only, no markdown or comments

Generate now:`
;
}
