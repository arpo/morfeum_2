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

import { 
  DOMINANT_ELEMENTS_RULES, 
  DOMINANT_ELEMENTS_EXAMPLE,
  DOMINANT_ELEMENTS_FORMAT,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../shared/elementRules';

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

  const rv = `Generate complete nodes with DNA for an entire location hierarchy in ONE response.

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

${NAVIGABLE_ELEMENTS_RULES}

${DOMINANT_ELEMENTS_RULES}

OUTPUT STRUCTURE:

For each node, generate:
1. **Scene-specific fields** (what you see/sense in THIS node)
2. **Structural fields** (navigation, search, metadata)
3. **Cascading DNA** (inheritable style attributes)

{
  "host": {
    "name": "Host Name",
    "description": "Host description",
    
    // STRUCTURAL FIELDS (at node root, NOT in DNA)
    "navigableElements": [],  // Usually empty for host (no navigation from world view)
    "dominantElements": [${DOMINANT_ELEMENTS_FORMAT.host}],
    "uniqueIdentifiers": ["Unique feature 1", "Unique feature 2"],
    "searchDesc": "Short search description (75-100 chars)",
    "slug": "kebab-case-name",
    
    // DNA - COMPLETE for host (all fields populated)
    "dna": {
      // Scene-specific visual fields (ALWAYS populated)
      "looks": "2-4 sentences describing what is seen",
      "colorsAndLighting": "1-3 sentences on colors and light",
      "atmosphere": "2-4 sentences on air, temperature, weather",
      "materials": "1-3 sentences on visible materials",
      "mood": "1-2 sentences on emotional tone",
      "sounds": "5-7 words listing sounds",
      "spatialLayout": "1-3 sentences on space layout",
      "primary_surfaces": "Main surface materials",
      "secondary_surfaces": "Secondary surface materials",
      "accent_features": "Decorative details",
      "dominant": "Primary color family",
      "secondary": "Secondary colors",
      "accent": "Accent colors",
      "ambient": "Light tone (warm/cool/neutral)",
      
      // Cascading style attributes (ONLY in host)
      "genre": "post-apocalyptic|fantasy|sci-fi|historical|modern|etc",
      "architectural_tone": "Architectural style",
      "cultural_tone": "Social/functional identity",
      "materials_base": "Material palette/style",
      "mood_baseline": "Emotional baseline",
      "palette_bias": "Color style/families",
      "soundscape_base": "Ambient sound style",
      "flora_base": "Plant life types or 'None'",
      "fauna_base": "Animal life types or 'None'"
    }
  },
  "regions": [
    {
      "name": "Region Name",
      "description": "Region description",
      
      // STRUCTURAL FIELDS
      "navigableElements": [],  // Usually empty for regions
      "dominantElements": [${DOMINANT_ELEMENTS_FORMAT.region}],
      "uniqueIdentifiers": ["Unique regional feature 1", "Unique regional feature 2"],
      "searchDesc": "Short description (75-100 chars)",
      "slug": "kebab-case-name",
      
      // DNA
      "dna": {
        // Scene-specific fields (ALWAYS populated)
        "looks": "What you see",
        "colorsAndLighting": "Colors and light",
        "atmosphere": "Air, temperature, weather",
        "materials": "Visible materials",
        "mood": "Emotional tone",
        "sounds": "Ambient sounds",
        "spatialLayout": "Space layout",
        "primary_surfaces": "Primary surfaces",
        "secondary_surfaces": "Secondary surfaces",
        "accent_features": "Accents",
        "dominant": "Dominant colors",
        "secondary": "Secondary colors",
        "accent": "Accent colors",
        "ambient": "Light tone",
        
        // Cascading attributes (SPARSE - null if inherited from host)
        "genre": null,  // NEVER set - inherited from host
        "architectural_tone": "style" or null,
        "cultural_tone": "culture" or null,
        "materials_base": "materials" or null,
        "mood_baseline": "mood" or null,
        "palette_bias": "palette" or null,
        "soundscape_base": "sounds" or null,
        "flora_base": "flora" or null,
        "fauna_base": "fauna" or null
      }
    }
  ],
  "locations": [
    {
      "regionName": "Which region this belongs to",
      "name": "Location Name",
      "description": "Location description",
      
      // STRUCTURAL FIELDS (CRITICAL for navigation!)
      "navigableElements": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
      "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
      "uniqueIdentifiers": ["Feature 1", "Feature 2"],
      "searchDesc": "Type, function, key visuals (75-100 chars)",
      "slug": "kebab-case-name",
      
      // DNA (same structure as regions)
      "dna": {
        // Scene fields (always populated)
        "looks": "...",
        "colorsAndLighting": "...",
        "atmosphere": "...",
        "materials": "...",
        "mood": "...",
        "sounds": "...",
        "spatialLayout": "...",
        "primary_surfaces": "...",
        "secondary_surfaces": "...",
        "accent_features": "...",
        "dominant": "...",
        "secondary": "...",
        "accent": "...",
        "ambient": "...",
        
        // Cascading (sparse - only if different from region)
        "genre": null,
        "architectural_tone": "..." or null,
        "cultural_tone": "..." or null,
        "materials_base": "..." or null,
        "mood_baseline": "..." or null,
        "palette_bias": "..." or null,
        "soundscape_base": "..." or null,
        "flora_base": "..." or null,
        "fauna_base": "..." or null
      }
    }
  ]
}

CRITICAL GUIDELINES

1. **JSON NULL vs STRING "null" (CRITICAL)**:
   - ALWAYS use actual JSON null, NEVER the string "null"
   - ❌ WRONG: "cultural_tone": "null"
   - ✓ CORRECT: "cultural_tone": null
   - When a cascading field is null, it will automatically inherit from parent
   - Only use null when you want inheritance - otherwise provide a specific value

2. **Architectural Consistency (CRITICAL)**:
   - architectural_tone is THE PRIMARY DRIVER of all architectural details
   - This includes: windows, doors, arches, pillars, columns, trim, molding, ceiling details, floor finishes
   - BE DETAILED AND SPECIFIC - include multiple architectural characteristics:
   
   **Examples of RICH architectural_tone (use this level of detail):**
   - ❌ TOO SPARSE: "decaying grandeur"
   - ✓ GOOD: "decaying Victorian grandeur with ornate Gothic arches, weathered neoclassical columns, elaborate carved molding, and aged brass fixtures"
   
   - ❌ TOO SPARSE: "rustic"
   - ✓ GOOD: "rustic handcrafted aesthetic with exposed timber beams, rough-hewn stone walls, hand-forged iron details, and weathered wood paneling"
   
   - ❌ TOO SPARSE: "modern minimalist"
   - ✓ GOOD: "modern minimalist design with clean geometric lines, floor-to-ceiling glass panels, polished concrete surfaces, and integrated steel fixtures"
   
   - ❌ TOO SPARSE: "industrial"
   - ✓ GOOD: "industrial aesthetic with exposed steel girders, riveted metal panels, large factory windows, and raw concrete floors"
   
   - ALL architectural elements must reflect the architectural_tone consistently
   - Interior spaces MUST match exterior architectural complexity and style
   - If parent has arched windows, child interiors should have arched doorways/passages
   - Material quality and finish MUST match architectural_tone (basic = simple finishes, ornate = refined details)

2. **Node Structure** - 3 Parts per Node:
   - Root-level fields: name, description, slug
   - Structural fields: navigableElements, dominantElements, uniqueIdentifiers, searchDesc
   - DNA object: scene-specific + cascading style attributes

2. **DNA Contains BOTH Scene AND Cascading Fields**:
   - Scene fields (14 fields - ALWAYS populated): looks, colorsAndLighting, atmosphere, materials, mood, sounds, spatialLayout, surfaces, colors
   - Cascading fields (9 fields - sparse in children): genre, architectural_tone, cultural_tone, materials_base, mood_baseline, palette_bias, soundscape_base, flora_base, fauna_base

3. **Scene Fields vs Cascading Fields**:
   - Scene fields: THIS node's appearance (what you actually see)
   - Cascading fields: General style that children inherit
   - Example: Scene "chrome walls, neon signs" → Cascade "cyberpunk industrial aesthetic"

4. **Structural Fields (NOT in DNA)**:
   - navigableElements: CRITICAL for navigation! List all doors, passages, stairs, etc.
   - dominantElements: Major objects/landmarks in the scene (array of strings)
   - uniqueIdentifiers: Distinctive features (array of strings)
   - searchDesc: Short description for search (75-100 chars)
   - slug: kebab-case-name

5. **Genre Inheritance**:
   - ONLY set "genre" in host DNA
   - All children: "genre": null (inherited automatically)
   - Example: Host sets "post-apocalyptic", all descendants inherit this

6. **Cascading Sparsity** - Child DNA Cascading Fields:
   - ALWAYS set scene fields (looks, atmosphere, etc.)
   - ONLY set cascading fields if DIFFERENT from parent
   - If same as parent: set to actual JSON null (not string "null")
   - Regions: 60-80% cascading fields populated (climate/biome differences)
   - Locations: 40-60% cascading fields populated (site-specific refinements)
   - Example: If region has "desert climate" and location is also desert → palette_bias: null
   - IMPORTANT: architectural_tone should rarely change - it defines the fundamental style of the entire world
   - When you DO set a cascading field, make it RICH and DETAILED (see architectural_tone examples above)

7. **Flora/Fauna in DNA (IMPORTANT)**:
   - flora_base and fauna_base are STYLE GUIDANCE, not literal placement
   - These indicate what types of vegetation/wildlife COULD exist in outdoor areas
   - Interior spaces should NOT have outdoor vegetation unless explicitly an indoor garden/atrium
   - Use flora_base as inspiration for: color palettes, decorative motifs, carved patterns, painted themes
   - Do NOT interpret flora_base as "put plants everywhere" - it's a style cue

8. **Output Format**:
   - Flat JSON only
   - No markdown, code fences, or comments
   - All required fields must be present

Generate now:`
;
  return rv;
}
