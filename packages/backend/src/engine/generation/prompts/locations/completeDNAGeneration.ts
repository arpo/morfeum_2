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
  }>,
  visualAnalysis?: any
): string {
  // Build visual analysis context section
  let visualAnalysisSection = '';
  if (visualAnalysis) {
    visualAnalysisSection = `
🎯 VISUAL ANALYSIS OF DEEPEST NODE (Your Context for Working Backwards):
(These scene details are ALREADY captured - DO NOT duplicate in DNA)

Looks: ${visualAnalysis.looks || 'N/A'}
Atmosphere: ${visualAnalysis.atmosphere || 'N/A'}
Lighting: ${visualAnalysis.lighting || 'N/A'}
Materials (Primary): ${visualAnalysis.materials_primary || 'N/A'}
Materials (Secondary): ${visualAnalysis.materials_secondary || 'N/A'}
Colors (Dominant): ${visualAnalysis.colors_dominant || 'N/A'}
Colors (Secondary): ${visualAnalysis.colors_secondary || 'N/A'}
Colors (Ambient): ${visualAnalysis.colors_ambient || 'N/A'}

📝 YOUR TASK - Work Backwards to Infer Parent DNA:
Use the scene details above to INFER what style properties the parent nodes should have.
This DNA will CASCADE DOWN the tree: Host → Region → Location → Future children.

ABSTRACTION EXAMPLES:
- Scene shows "polished chrome walls" → Host DNA: "industrial metallic aesthetic"
- Scene shows "deep blue haze" → Host DNA: "cool, muted palette with ethereal tones"
- Scene shows "hovering platforms" → Host DNA: "anti-gravity architectural style"

KEY PRINCIPLES:
1. DO NOT repeat specific scene details (those are already captured)
2. DO generate STYLE/VIBE that would produce similar scenes in future children
3. Host DNA = world-level style that could produce this kind of location
4. Region DNA = biome-level refinements
5. Location DNA = site-level refinements
`;
  }

  const rv = `Generate complete DNA for an entire location hierarchy in ONE response.

🔄 CASCADE DIRECTION: You are working BACKWARDS from the deepest node! 🔄

The deepest node (location/niche) has been ANALYZED and has scene details.
Your task: INFER what DNA the parent nodes (host/region) should have, so that DNA can CASCADE DOWN.

FLOW:
1. We have the DEEPEST NODE with visual analysis (scene specifics)
2. You generate DNA for HOST (world-level style)
3. You generate DNA for REGION (biome-level style, refines host)
4. You generate DNA for LOCATION (site-level style, refines region)
5. Later, this DNA CASCADES DOWN: Host → Region → Location → Future Children

 DNA contains ONLY cascading STYLE/VIBE properties - NOT scene-specific details 
Scene-specific details (looks, atmosphere, lighting, materials, colors) come from visual analysis.
DNA defines the STYLE PALETTE that cascades to children, not the actual physical appearance.

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
${visualAnalysisSection}
OUTPUT STRUCTURE:

{
  "host": {
    // FULL DNA - all 9 fields populated
    // These are STYLE/VIBE properties that cascade to children
    // Do NOT include scene-specific fields (looks, atmosphere, lighting, materials, colors)
    "genre": "post-apocalyptic|fantasy|sci-fi|historical|modern|etc",
    "architectural_tone": "2-4 words describing architectural STYLE (not specific structures)",
    "cultural_tone": "1-2 sentences on social/functional identity",
    "materials_base": "2-3 sentences on material PALETTE/STYLE (not specific objects)",
    "mood_baseline": "2-3 words describing emotional tone",
    "palette_bias": "2-3 sentences on COLOR STYLE/FAMILIES (not specific colors in scene)",
    "soundscape_base": "2-3 sentences describing ambient SOUND STYLE",
    "flora_base": "2-3 sentences on plant life types, or 'None'",
    "fauna_base": "2-3 sentences on animal life types, or 'None'"
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

 CRITICAL GUIDELINES - SPARSE DNA ENFORCEMENT 

1. **Host DNA**: Generate ALL 9 fields with complete descriptions
   - genre: ONLY set in host (world-level constant)
   - All other fields: full descriptions

2. **Child DNA - FIELD-BY-FIELD SPARSE ENFORCEMENT**:
   
    FOR EACH OF THE 8 CASCADING FIELDS, YOU MUST ASK: "Is this DIFFERENT from parent?" 
   
   Go through EVERY field in this exact order for child nodes:
   
   1. architectural_tone → Different from parent? If NO → null
   2. cultural_tone → Different from parent? If NO → null
   3. materials_base → Different from parent? If NO → null
   4. mood_baseline → Different from parent? If NO → null
   5. palette_bias → Different from parent? If NO → null
   6. soundscape_base → Different from parent? If NO → null
   7. flora_base → Different from parent? If NO → null
   8. fauna_base → Different from parent? If NO → null
   
    NEVER include "genre" in child nodes - it's always inherited from host 
   
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
   
    REGIONS are biomes/climates - they should populate MORE fields 
   Regions define climate, regional materials, regional sounds, regional flora/fauna.
   They should have 60-80% fields populated (only 20-40% null).
   
    LOCATIONS refine regions - moderate sparsity 
   Locations inherit from region and refine specific aspects.
   They should have 40-60% fields populated (40-60% null).
   
    NICHES are smallest - highest sparsity 
   Niches inherit from location and add intimate details.
   They should have 20-40% fields populated (60-80% null).

    NEVER INCLUDE SCENE FIELDS IN DNA 
   - NO "looks" (comes from visual analysis)
   - NO "atmosphere" (comes from visual analysis)
   - NO "lighting" (comes from visual analysis)
   - NO specific materials/colors (comes from visual analysis)
   - DNA is about STYLE/VIBE that cascades, not scene specifics

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
  return rv;
}
