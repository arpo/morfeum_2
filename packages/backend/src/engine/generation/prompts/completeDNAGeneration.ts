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
  const rv = `Generate complete DNA for an entire location hierarchy in ONE response.

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

⚠️ CRITICAL GUIDELINES - SPARSE DNA ENFORCEMENT ⚠️

1. **Host DNA**: Generate ALL 22 fields with complete descriptions

2. **Child DNA - FIELD-BY-FIELD SPARSE ENFORCEMENT**:
   
   🚨 FOR EACH OF THE 22 FIELDS, YOU MUST ASK: "Is this DIFFERENT from parent?" 🚨
   
   Go through EVERY field in this exact order for child nodes:
   
   1. looks → Different? If NO → null
   2. colorsAndLighting → Different? If NO → null
   3. atmosphere → Different? If NO → null
   4. architectural_tone → Different? If NO → null
   5. cultural_tone → Different? If NO → null
   6. materials → Different? If NO → null
   7. mood → Different? If NO → null
   8. sounds → Different? If NO → null
   9. dominantElementsDescriptors → Different? If NO → null
   10. spatialLayout → Different? If NO → null
   11. primary_surfaces → Different? If NO → null
   12. secondary_surfaces → Different? If NO → null
   13. accent_features → Different? If NO → null
   14. dominant → Different? If NO → null
   15. secondary → Different? If NO → null
   16. accent → Different? If NO → null
   17. ambient → Different? If NO → null
   18. uniqueIdentifiers → Different? If NO → null
   19. searchDesc → Must be unique, always provide
   
   EXAMPLE - Camden region (parent: London):
   1. looks: Camden has street art, markets → DIFFERENT → Provide value
   2. colorsAndLighting: Same urban lighting → SAME → null
   3. atmosphere: Camden more bohemian → DIFFERENT → Provide value
   4. architectural_tone: Same Victorian/modern mix → SAME → null
   5. cultural_tone: Camden alternative scene → DIFFERENT → Provide value
   6. materials: Same brick/concrete → SAME → null
   7. mood: Camden more rebellious → DIFFERENT → Provide value
   8. sounds: Same traffic/urban sounds → SAME → null
   9. dominantElementsDescriptors: Camden markets unique → DIFFERENT → Provide value
   10. spatialLayout: Same dense urban → SAME → null
   11. primary_surfaces: Same brick/concrete → SAME → null
   12. secondary_surfaces: Same → SAME → null
   13. accent_features: Camden street art unique → DIFFERENT → Provide value
   14. dominant: Same gray → SAME → null
   15. secondary: Same → SAME → null
   16. accent: Camden neon different → DIFFERENT → Provide value
   17. ambient: Same → SAME → null
   18. uniqueIdentifiers: Camden Lock Market → DIFFERENT → Provide value
   19. searchDesc: Always unique → Provide value
   
   RESULT: 9 fields populated, 13 null (this is correct!)
   
   ⚠️ PASSTHROUGH REGIONS (empty description, same name as host):
   Provide minimum 2-3 contextual fields to prevent completely empty DNA.
   
   🚨 TARGET: Child nodes should have 60-70% fields as null 🚨

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
  console.log(rv);
  return rv;
}
