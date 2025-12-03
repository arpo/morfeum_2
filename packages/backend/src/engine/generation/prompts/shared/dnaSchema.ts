/**
 * Shared DNA Schema Definitions
 * 
 * Single source of truth for DNA field descriptions, structure schema,
 * and JSON templates used across all DNA generation prompts.
 */

// ============================================================================
// STRUCTURE SCHEMA
// ============================================================================

export const STRUCTURE_OPTIONS = {
  form: ['rectangular', 'round', 'cylindrical', 'spherical', 'faceted', 'organic', 'arched', 'gothic', 'irregular'],
  roofType: ['domed', 'flat', 'vaulted', 'pitched', 'geodesic', 'arched', 'open-sky'],
  scale: ['small', 'medium', 'large'],
  orientation: ['vertical', 'horizontal', 'wide', 'cubic'],
  openings: ['large-glass', 'arched-windows', 'narrow-slits', 'open-passages', 'minimal', 'none'],
  functionalType: ['residential', 'commercial', 'religious', 'industrial', 'civic', 'entertainment']
} as const;

/**
 * Build the structure schema string for JSON templates
 */
export function buildStructureSchemaString(): string {
  return `"structure": {
      "form": "PICK ONE: ${STRUCTURE_OPTIONS.form.join(', ')}",
      "roofType": "PICK ONE: ${STRUCTURE_OPTIONS.roofType.join(', ')}",
      "scale": "PICK ONE: ${STRUCTURE_OPTIONS.scale.join(', ')}",
      "orientation": "PICK ONE: ${STRUCTURE_OPTIONS.orientation.join(', ')}",
      "openings": "PICK ONE: ${STRUCTURE_OPTIONS.openings.join(', ')}",
      "functionalType": "PICK ONE: ${STRUCTURE_OPTIONS.functionalType.join(', ')}"
    }`;
}

/**
 * Build structure field for a specific node type
 * Returns the structure schema for locations, null instruction for others
 */
export function buildStructureField(nodeType: string, indent: number = 4): string {
  const spaces = ' '.repeat(indent);
  
  if (nodeType === 'location') {
    return `${spaces}${buildStructureSchemaString()},`;
  }
  
  // For niche, region, host - structure should be null
  return `${spaces}"structure": null,  // Only locations have structure`;
}

// ============================================================================
// DNA FIELD DESCRIPTIONS
// ============================================================================

export const DNA_SCENE_FIELDS = {
  looks: '2-4 sentences: key forms, layout, scale, notable features',
  colorsAndLighting: '1-3 sentences: colors, light sources, shadows',
  atmosphere: '2-4 sentences: air quality, temperature, motion, weather',
  materials: '1-3 sentences: main materials, textures, condition',
  mood: '1-2 sentences: emotional tone, feelings evoked',
  sounds: '5-10 words: ambient sounds',
  spatialLayout: '1-3 sentences: space shape, dimensions, depth',
  primary_surfaces: 'Main surfaces with adjectives',
  secondary_surfaces: 'Supporting materials',
  accent_features: 'Decorative/eye-catching details',
  dominant: 'Primary color with coverage area',
  secondary: 'Secondary color and placement',
  accent: 'Accent colors and placement',
  ambient: 'Overall light tone'
} as const;

export const DNA_CASCADING_FIELDS = {
  genre: 'World genre (cyberpunk, fantasy, etc.) - HOST ONLY',
  architectural_tone: 'Style phrase (e.g., "weathered Victorian with Gothic arches")',
  cultural_tone: 'Who uses this, what purpose',
  materials_base: 'Material palette style',
  mood_baseline: 'Emotional baseline',
  palette_bias: 'Color families defining this space',
  soundscape_base: 'Ambient sound style',
  flora_base: 'Plant life or "None"',
  fauna_base: 'Animal life or "None"'
} as const;

// ============================================================================
// DNA JSON TEMPLATE BUILDERS
// ============================================================================

export interface DNATemplateOptions {
  /** Whether to include structure field (locations only) */
  includeStructure: boolean;
  /** How to handle genre: 'host' = set value, 'null' = always null, 'conditional' = based on nodeType */
  genreHandling: 'host' | 'null' | 'conditional';
  /** Description length: 'short' for compact prompts, 'long' for detailed */
  descLength: 'short' | 'long';
  /** Node type for conditional handling */
  nodeType?: string;
}

/**
 * Build the DNA fields section for JSON templates
 */
export function buildDNAFieldsString(options: DNATemplateOptions): string {
  const { includeStructure, genreHandling, descLength, nodeType } = options;
  const short = descLength === 'short';
  
  // Scene fields
  const sceneFields = short ? `
    "looks": "${DNA_SCENE_FIELDS.looks}",
    "colorsAndLighting": "${DNA_SCENE_FIELDS.colorsAndLighting}",
    "atmosphere": "${DNA_SCENE_FIELDS.atmosphere}",
    "materials": "${DNA_SCENE_FIELDS.materials}",
    "mood": "${DNA_SCENE_FIELDS.mood}",
    "sounds": "${DNA_SCENE_FIELDS.sounds}",
    "spatialLayout": "${DNA_SCENE_FIELDS.spatialLayout}",
    "primary_surfaces": "${DNA_SCENE_FIELDS.primary_surfaces}",
    "secondary_surfaces": "${DNA_SCENE_FIELDS.secondary_surfaces}",
    "accent_features": "${DNA_SCENE_FIELDS.accent_features}",
    "dominant": "${DNA_SCENE_FIELDS.dominant}",
    "secondary": "${DNA_SCENE_FIELDS.secondary}",
    "accent": "${DNA_SCENE_FIELDS.accent}",
    "ambient": "${DNA_SCENE_FIELDS.ambient}",` : `
    // === SCENE-SPECIFIC VISUAL FIELDS (always populated) ===
    "looks": "2-4 sentences describing what is seen — key forms, layout, and notable features.",
    "colorsAndLighting": "1-3 sentences on dominant colors and light behavior.",
    "atmosphere": "2-4 sentences on air, temperature, motion, weather, and sensory feel.",
    "materials": "1-3 sentences naming main materials and textures, their condition and finish.",
    "mood": "1-2 sentences on the emotional tone this place evokes.",
    "sounds": "5-7 words listing ambient sounds.",
    "spatialLayout": "1-3 sentences on space shape, dimensions, entry points, and focal centers.",
    "primary_surfaces": "Main materials on walls, floor, ceiling.",
    "secondary_surfaces": "Supporting materials on furniture or structure.",
    "accent_features": "Decorative or striking details.",
    "dominant": "Primary color family with coverage area.",
    "secondary": "Secondary color and where it appears.",
    "accent": "Accent colors and placement.",
    "ambient": "Overall light tone (warm / cool / neutral).",`;

  // Structure field
  const structureField = includeStructure 
    ? `
    ${buildStructureSchemaString()},`
    : `
    "structure": null,`;

  // Genre field based on handling mode
  let genreField: string;
  if (genreHandling === 'host') {
    genreField = `"genre": "World genre (cyberpunk, fantasy, etc.)",`;
  } else if (genreHandling === 'null') {
    genreField = `"genre": null,`;
  } else {
    // conditional based on nodeType
    genreField = nodeType === 'host' 
      ? `"genre": "World genre (cyberpunk, fantasy, etc.)",`
      : `"genre": null,`;
  }

  // Cascading fields
  const cascadingFields = short ? `
    ${genreField}
    "architectural_tone": "${DNA_CASCADING_FIELDS.architectural_tone}",
    "cultural_tone": "${DNA_CASCADING_FIELDS.cultural_tone}",
    "materials_base": "${DNA_CASCADING_FIELDS.materials_base}",
    "mood_baseline": "${DNA_CASCADING_FIELDS.mood_baseline}",
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias}",
    "soundscape_base": "${DNA_CASCADING_FIELDS.soundscape_base}",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base}",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base}"` : `
    // === CASCADING STYLE ATTRIBUTES (optional - can be null if inherited) ===
    ${genreField}
    "architectural_tone": "Short phrase (e.g., 'industrial metallic', 'organic stone') OR null to inherit",
    "cultural_tone": "1 sentence on social/functional identity OR null to inherit",
    "materials_base": "Material palette/style (NOT specific objects) OR null to inherit",
    "mood_baseline": "Emotional baseline OR null to inherit",
    "palette_bias": "Color style/families (NOT specific scene colors) OR null to inherit",
    "soundscape_base": "Ambient sound style OR null to inherit",
    "flora_base": "Plant life types OR 'None' OR null to inherit",
    "fauna_base": "Animal life types OR 'None' OR null to inherit"`;

  return `${sceneFields}${structureField}${cascadingFields}`;
}

// ============================================================================
// COMMON GUIDELINES
// ============================================================================

export const DNA_GUIDELINES = {
  sceneVsCascading: `**Scene vs. Cascading Fields**
   - Scene fields: Describe THIS specific location's appearance (looks, colors, materials visible)
   - Cascading fields: General style that could produce similar children (architectural style, color palette bias)
   - Example: Scene "polished chrome walls" → Cascade "industrial metallic aesthetic"`,
  
  genreRule: `**Genre Rule**
   - ONLY the host node sets genre
   - All other nodes: "genre": null`,
  
  outputFormat: `**Output Format**
   - Pure JSON only - no markdown fences, no comments
   - All scene fields required
   - Cascading fields can be null for inheritance`,
  
  structureRule: `**Structure Field**
   - LOCATIONS: MUST populate structure for buildings/constructed exteriors
   - NICHES: Set structure to null - inherit from parent location
   - REGIONS/HOSTS: Set to null
   - Natural landscapes: Set to null`
};

/**
 * Build combined guidelines string
 */
export function buildGuidelines(includeStructure: boolean = true): string {
  let guidelines = `
${DNA_GUIDELINES.sceneVsCascading}

${DNA_GUIDELINES.genreRule}

${DNA_GUIDELINES.outputFormat}`;

  if (includeStructure) {
    guidelines += `

${DNA_GUIDELINES.structureRule}`;
  }

  return guidelines;
}
