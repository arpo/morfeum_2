/**
 * Deepest Node DNA Generation Prompt (Optimized for Speed)
 * 
 * Generates FULL DNA for the deepest node in a world tree hierarchy.
 * This DNA is used to generate an image, so be RICH and DETAILED.
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
  // Build compact parent context
  const parentContext = parentChain.length > 0
    ? `\nCONTEXT: ${parentChain.map(p => `${p.type}: ${p.name}`).join(' → ')}\n`
    : '';

  // Build compact classification hints
  const hints = [classificationData.looks, classificationData.atmosphere, classificationData.mood]
    .filter(Boolean)
    .join('; ');
  const hintsSection = hints ? `\nHINTS: ${hints}\n` : '';

  // Compact type instruction
  const typeHint = getCompactTypeHint(nodeType);

  return `Generate DNA for a ${nodeType} named "${nodeName}".
${parentContext}${hintsSection}
DESCRIPTION: ${nodeDescription}
USER REQUEST: ${originalPrompt}

${typeHint}

OUTPUT (JSON only, no markdown):
{
  "name": "${nodeName}",
  "description": "2-3 sentences about purpose and character",
  "navigableElements": [{"type": "door|passage|stairs|archway|path", "position": "location", "description": "brief"}],
  "dominantElements": ["3-5 major features"],
  "uniqueIdentifiers": ["3-5 distinctive features"],
  "searchDesc": "75-100 char description",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "dna": {
    "looks": "3-5 sentences: key forms, layout, scale, notable features",
    "colorsAndLighting": "2-3 sentences: colors, light sources, shadows, time of day",
    "atmosphere": "3-5 sentences: air quality, temperature, motion, weather",
    "materials": "2-3 sentences: main materials, textures, condition",
    "mood": "2-3 sentences: emotional tone, feelings evoked",
    "sounds": "7-10 words: ambient sounds",
    "spatialLayout": "2-4 sentences: space shape, dimensions, depth",
    "primary_surfaces": "Main surfaces with adjectives",
    "secondary_surfaces": "Supporting materials",
    "accent_features": "Decorative/eye-catching details",
    "dominant": "Primary color with coverage area",
    "secondary": "Secondary color and placement",
    "accent": "Accent colors and placement",
    "ambient": "Overall light tone",
    ${nodeType === 'location' ? `"structure": {
      "form": "PICK ONE: rectangular, round, cylindrical, spherical, faceted, organic, arched, gothic, irregular",
      "roofType": "PICK ONE: domed, flat, vaulted, pitched, geodesic, arched, open-sky",
      "scale": "PICK ONE: small, medium, large",
      "orientation": "PICK ONE: vertical, horizontal, wide, cubic",
      "openings": "PICK ONE: large-glass, arched-windows, narrow-slits, open-passages, minimal, none",
      "functionalType": "PICK ONE: residential, commercial, religious, industrial, civic, entertainment"
    },` : ''}
    ${nodeType === 'host' ? '"genre": "World genre (cyberpunk, fantasy, etc.)",' : '"genre": null,'}
    "architectural_tone": "DETAILED style (e.g., 'weathered Victorian with Gothic arches, carved molding')",
    "cultural_tone": "Who uses this, what purpose",
    "materials_base": "Material palette style",
    "mood_baseline": "Emotional baseline",
    "palette_bias": "Color families defining this space",
    "soundscape_base": "Ambient sound style",
    "flora_base": "Plant life or 'None'",
    "fauna_base": "Animal life or 'None'"
  }
}

RULES:
- Be SPECIFIC (not "nice" but "weathered brass with verdigris patina")
- architectural_tone is CRITICAL for image generation
- Pure JSON output, no explanations`;
}

/**
 * Get compact type hint
 */
function getCompactTypeHint(nodeType: 'host' | 'region' | 'location' | 'niche'): string {
  switch (nodeType) {
    case 'host':
      return 'TYPE: HOST (world/city level, aerial view, MUST set genre, all cascading fields required)';
    case 'region':
      return 'TYPE: REGION (district/area level, street-level view, no genre)';
    case 'location':
      return 'TYPE: LOCATION (building exterior, facade/entrance view, no genre)';
    case 'niche':
      return 'TYPE: NICHE (interior space, room view from entrance, no genre)';
  }
}
