/**
 * Deepest Node DNA Generation Prompt
 * 
 * Generates FULL DNA for the deepest node in a world tree hierarchy.
 * This is the first DNA generated, before image creation.
 * 
 * Key differences from regular nodeDNAGeneration:
 * - Generates COMPLETE DNA (not sparse) since no parent DNA exists yet
 * - Type-aware: handles host, region, location, niche differently
 * - For hosts: Sets genre + all cascading fields (it's the root)
 * - For other types: Still populates all fields to inform image generation
 * 
 * @param originalPrompt - Original user input
 * @param nodeType - Type of deepest node (host | region | location | niche)
 * @param nodeName - Name of the deepest node
 * @param nodeDescription - Description from hierarchy classification
 * @param classificationData - Additional visual data from hierarchy classification (looks, atmosphere, mood)
 * @param parentChain - Array of parent nodes for context (from host down to parent of deepest)
 * @returns Prompt string for LLM
 */
export function deepestNodeDNAGeneration(
  originalPrompt: string,
  nodeType: 'host' | 'region' | 'location' | 'niche',
  nodeName: string,
  nodeDescription: string,
  classificationData: {
    looks?: string;
    atmosphere?: string;
    mood?: string;
  },
  parentChain: Array<{
    type: string;
    name: string;
    description: string;
  }>
): string {
  // Build parent chain context section
  let parentChainContext = '';
  if (parentChain.length > 0) {
    parentChainContext = `
WORLD CONTEXT (ancestor nodes - use for coherence):
${parentChain.map(p => `- ${p.type.toUpperCase()}: ${p.name} - ${p.description}`).join('\n')}

Use this context to ensure the DNA is coherent with the broader world setting.
`;
  }

  // Build classification data section (visual hints from hierarchy classification)
  let classificationContext = '';
  if (classificationData.looks || classificationData.atmosphere || classificationData.mood) {
    classificationContext = `
VISUAL HINTS (from initial classification):
${classificationData.looks ? `- Looks: ${classificationData.looks}` : ''}
${classificationData.atmosphere ? `- Atmosphere: ${classificationData.atmosphere}` : ''}
${classificationData.mood ? `- Mood: ${classificationData.mood}` : ''}

Expand on these hints to create rich, detailed DNA.
`;
  }

  // Type-specific instructions
  const typeInstructions = getTypeInstructions(nodeType);

  return `Generate COMPLETE DNA for a ${nodeType} node. This DNA will be used to generate an image, so be RICH and DETAILED.

ORIGINAL USER INPUT:
${originalPrompt}

NODE TO GENERATE DNA FOR:
Type: ${nodeType}
Name: ${nodeName}
Description: ${nodeDescription}
${parentChainContext}${classificationContext}
${typeInstructions}

OUTPUT JSON STRUCTURE:

{
  "name": "${nodeName}",
  "description": "2-3 sentences expanding on the node's purpose and character",
  
  // === STRUCTURAL FIELDS (for navigation and search) ===
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window|path|gate", "position": "location in scene", "description": "what it is"}
  ],
  "dominantElements": ["3-5 major positioned objects/features in scene"],
  "uniqueIdentifiers": ["3-5 distinctive visual features that make this place recognizable"],
  "searchDesc": "75-100 char search-friendly description",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  
  // === DNA: COMPLETE VISUAL PROFILE ===
  "dna": {
    // --- Scene-Specific Visual Fields (ALWAYS populated, be DETAILED) ---
    "looks": "3-5 sentences describing what is seen — key forms, layout, scale, notable features, materials visible.",
    "colorsAndLighting": "2-3 sentences on dominant colors, light sources, shadows, color temperature, time of day feel.",
    "atmosphere": "3-5 sentences on air quality, temperature, humidity, motion (wind/mist/particles), weather if outdoor.",
    "materials": "2-3 sentences naming main materials, their textures, finishes, condition (aged, polished, etc.).",
    "mood": "2-3 sentences on the emotional tone, what feelings this place evokes.",
    "sounds": "7-10 words listing ambient sounds appropriate to this space.",
    "spatialLayout": "2-4 sentences on space shape, dimensions, entry points, focal centers, depth.",
    "primary_surfaces": "Main materials on walls, floor, ceiling with descriptive adjectives.",
    "secondary_surfaces": "Supporting materials on furniture, fixtures, or secondary structures.",
    "accent_features": "Decorative, striking, or eye-catching details.",
    "dominant": "Primary color family with coverage area (e.g., 'deep burgundy covering 40% of walls').",
    "secondary": "Secondary color and where it appears.",
    "accent": "Accent colors and specific placement.",
    "ambient": "Overall light tone (warm amber / cool blue / neutral white / etc.).",
    
    // --- Cascading Style Attributes (FULLY populated for this deepest node) ---
    ${nodeType === 'host' ? '"genre": "The world genre (e.g., post-apocalyptic, fantasy, sci-fi, cyberpunk, historical, modern, steampunk)",' : '"genre": null,  // Only hosts set genre'}
    "architectural_tone": "DETAILED architectural style phrase (e.g., 'weathered Victorian grandeur with ornate Gothic arches, neoclassical columns, elaborate carved molding')",
    "cultural_tone": "2-3 sentences on social/functional identity, who uses this space, what purpose it serves",
    "materials_base": "Material palette/style that could produce similar spaces (e.g., 'reclaimed industrial metals, distressed leather, aged brass')",
    "mood_baseline": "Emotional baseline that permeates this space and could extend to connected areas",
    "palette_bias": "Color style/families that define this world (e.g., 'desaturated earth tones with neon accent punches')",
    "soundscape_base": "Ambient sound style (e.g., 'industrial hum with distant machinery, occasional steam bursts')",
    "flora_base": "Plant life types that might exist here, or 'None' if sterile environment",
    "fauna_base": "Animal/creature life types that might exist here, or 'None' if uninhabited"
  }
}

CRITICAL GUIDELINES:

1. **RICH DETAIL FOR IMAGE GENERATION**
   - This DNA will directly inform image generation
   - Be SPECIFIC about materials, colors, textures
   - Include enough detail that an image generator can visualize it
   - Avoid vague terms like "nice" or "interesting" - be concrete

2. **ARCHITECTURAL TONE IS CRITICAL**
   - This sets the visual foundation for the entire space
   - Include: building style, window/door shapes, decorative elements, finishes
   - Example GOOD: "brutalist concrete with floor-to-ceiling industrial windows, exposed steel beams, raw aggregate surfaces"
   - Example BAD: "modern" (too vague)

3. **SCENE vs CASCADING COHERENCE**
   - Scene fields describe THIS specific view
   - Cascading fields describe the STYLE that could produce similar spaces
   - Scene: "Polished chrome pillars reflecting neon lights" 
   - Cascade: "Industrial chrome aesthetic with integrated neon lighting"

4. **NAVIGABLE ELEMENTS**
   - Include 2-4 navigable elements for future exploration
   - Be specific about position (left wall, center background, right foreground, etc.)
   - Consider what makes sense for this type of space

5. **OUTPUT FORMAT**
   - Pure JSON only - no markdown fences, no comments, no explanations
   - All fields must be populated (no nulls except genre for non-hosts)

Generate the complete DNA now:`;
}

/**
 * Get type-specific instructions for DNA generation
 */
function getTypeInstructions(nodeType: 'host' | 'region' | 'location' | 'niche'): string {
  switch (nodeType) {
    case 'host':
      return `
TYPE-SPECIFIC INSTRUCTIONS (HOST):
- This is a WORLD/CITY level view - think grand scale, skyline, atmosphere
- You MUST set the "genre" field - this defines the entire world
- All cascading fields must be populated as this is the ROOT of the hierarchy
- Think: What defines this world? What rules govern its aesthetics?
- Navigable elements could be: major landmarks, districts visible, paths leading into the world
- Image will likely be an elevated/aerial view showing the overall character
`;
    case 'region':
      return `
TYPE-SPECIFIC INSTRUCTIONS (REGION):
- This is a DISTRICT/AREA level view - think neighborhood, biome, local character
- Do NOT set genre (it will be inherited from host later)
- Populate all cascading fields to establish regional character
- Think: How does this region differ from others? What's its local flavor?
- Navigable elements could be: streets, squares, notable buildings in distance
- Image will likely show street-level or district overview
`;
    case 'location':
      return `
TYPE-SPECIFIC INSTRUCTIONS (LOCATION):
- This is a BUILDING/SITE EXTERIOR view - think facade, entrance, immediate surroundings
- Do NOT set genre (inherited from ancestors)
- Populate cascading fields to establish site-specific character
- Think: What makes this building/site unique? What's the exterior character?
- Navigable elements: main entrance, side doors, windows, paths around the building
- Image will show the exterior approach to this location
`;
    case 'niche':
      return `
TYPE-SPECIFIC INSTRUCTIONS (NICHE):
- This is an INTERIOR SPACE view - think room, area within a building
- Do NOT set genre (inherited from ancestors)
- Populate cascading fields to establish interior atmosphere
- Think: What's the spatial character? How does light behave? What's the ambiance?
- Navigable elements: doors to other rooms, stairs, passages, interesting features to examine
- Image will show interior perspective, what you see upon entering
`;
  }
}
