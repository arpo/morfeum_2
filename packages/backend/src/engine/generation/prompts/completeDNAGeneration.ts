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
    // FULL DNA - all 9 fields populated
    "genre": "post-apocalyptic|fantasy|sci-fi|historical|modern|etc",
    "architectural_tone": "2-4 words describing architectural style",
    "cultural_tone": "1-2 sentences on social/functional identity",
    "materials_base": "2-3 sentences naming main materials and textures",
    "mood_baseline": "2-3 words describing emotional tone",
    "palette_bias": "2-3 sentences on dominant color families and overall palette",
    "soundscape_base": "2-3 sentences describing ambient sounds",
    "flora_base": "2-3 sentences on plant life, vegetation types, or 'None'",
    "fauna_base": "2-3 sentences on animal life, creatures, or 'None'"
  },
  "regions": [
    {
      "name": "Region Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from Host
        // Set to null for fields that inherit from Host
        // Genre is NEVER provided (always inherited from host)
        "architectural_tone": "different style" or null,
        "cultural_tone": "different culture" or null,
        "materials_base": "different materials" or null,
        "mood_baseline": "different mood" or null,
        "palette_bias": "different colors" or null,
        "soundscape_base": "different sounds" or null,
        "flora_base": "different vegetation" or null,
        "fauna_base": "different creatures" or null
      }
    }
  ],
  "locations": [
    {
      "regionName": "Which region this belongs to",
      "name": "Location Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from Host + Region
        // Genre is NEVER provided (always inherited from host)
        "architectural_tone": "refined style" or null,
        "cultural_tone": "specific culture" or null,
        "materials_base": "specific materials" or null,
        "mood_baseline": "specific mood" or null,
        "palette_bias": "specific colors" or null,
        "soundscape_base": "specific sounds" or null,
        "flora_base": "specific vegetation" or null,
        "fauna_base": "specific creatures" or null
      }
    }
  ],
  "niches": [
    {
      "locationName": "Which location this belongs to",
      "name": "Niche Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from parent chain
        // Genre is NEVER provided (always inherited from host)
        "architectural_tone": "intimate style" or null,
        "materials_base": "detail materials" or null,
        "mood_baseline": "intimate mood" or null,
        "soundscape_base": "intimate sounds" or null,
        "flora_base": "localized vegetation" or null,
        "fauna_base": "localized creatures" or null
      }
    }
  ]
}

⚠️ CRITICAL GUIDELINES - SPARSE DNA ENFORCEMENT ⚠️

1. **Host DNA**: Generate ALL 9 fields with complete descriptions
   - genre: ONLY set in host (world-level constant)
   - All other fields: full descriptions

2. **Child DNA - FIELD-BY-FIELD SPARSE ENFORCEMENT**:
   
   🚨 FOR EACH OF THE 8 CASCADING FIELDS, YOU MUST ASK: "Is this DIFFERENT from parent?" 🚨
   
   Go through EVERY field in this exact order for child nodes:
   
   1. architectural_tone → Different from parent? If NO → null
   2. cultural_tone → Different from parent? If NO → null
   3. materials_base → Different from parent? If NO → null
   4. mood_baseline → Different from parent? If NO → null
   5. palette_bias → Different from parent? If NO → null
   6. soundscape_base → Different from parent? If NO → null
   7. flora_base → Different from parent? If NO → null
   8. fauna_base → Different from parent? If NO → null
   
   🚨 NEVER include "genre" in child nodes - it's always inherited from host 🚨
   
   EXAMPLE - Desert Canyon region (parent: Post-Apocalyptic Earth):
   1. architectural_tone: Desert more sun-bleached wreckage → DIFFERENT → "sun-bleached metal ruins"
   2. cultural_tone: Same survival-focused → SAME → null
   3. materials_base: Desert more sand-scoured → DIFFERENT → "rust-eaten metal, sand-scoured scrap"
   4. mood_baseline: Same grim determination → SAME → null
   5. palette_bias: Desert more rust/sand colors → DIFFERENT → "rust orange, sand yellow, dark grey"
   6. soundscape_base: Desert wind different → DIFFERENT → "wind through metal, sand shifting"
   7. flora_base: Desert vegetation different → DIFFERENT → "desert cacti, radiation-mutated shrubs"
   8. fauna_base: Desert creatures different → DIFFERENT → "scorpions, vultures, sand beetles"
   
   RESULT: 6 fields populated, 2 null (this is correct!)
   
   ⚠️ PASSTHROUGH REGIONS (empty description, same name as host):
   Provide minimum 2-3 contextual fields to prevent completely empty DNA.
   
   🚨 TARGET: Child nodes should have 40-60% fields as null 🚨

3. **Genre Inheritance**:
   - Genre is ONLY set in host DNA
   - All children inherit genre automatically - NEVER include it in child DNA
   - Example: Host sets "post-apocalyptic", all regions/locations/niches inherit this

4. **Inheritance Chain**: 
   - Regions inherit from Host
   - Locations inherit from Host + Region
   - Niches inherit from Host + Region + Location

5. **Parent References**: 
   - Locations must specify "regionName"
   - Niches must specify "locationName"

6. **Consistency**: Maintain coherence across hierarchy
   - Genre stays constant throughout
   - Other fields cascade and can be refined

7. **Output**: Flat JSON only, no markdown or comments

Generate now:`
;
  console.log(rv);
  return rv;
}
