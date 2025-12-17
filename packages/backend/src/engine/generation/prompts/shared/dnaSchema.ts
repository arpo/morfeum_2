/**
 * Shared DNA Schema Definitions
 * 
 * Single source of truth for DNA field descriptions and JSON templates
 * used across all DNA generation prompts.
 * 
 * NOTE: Structure is now a separate node property, not part of DNA.
 */

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
  palette_bias: 'Color families defining this space',
  flora_base: 'Plant life or "None"',
  fauna_base: 'Animal life or "None"'
} as const;

// ============================================================================
// DOMINANT ELEMENTS FORMAT (for targetSeed support in GO_INSIDE)
// ============================================================================

/**
 * Compact rules string for dominantElements - use in prompts BEFORE the JSON template.
 * Single source of truth - import this in all prompt files.
 */
export const DOMINANT_ELEMENTS_RULES = `DOMINANTELEMENTS (CRITICAL - for GO_INSIDE support):
- ONLY physically enterable structures (doors, buildings, vehicles, portals, caves)
- NEVER include: trees, decorations, terrain, patterns, atmosphere, general features
- FORMAT: "[name]: [shape], [scale], interior has [floor], [walls], [lighting]"
- Return empty array [] if nothing is enterable`;

/**
 * Example for JSON template placeholders - shows exact format expected.
 * Use this AS the placeholder value in JSON templates.
 */
export const DOMINANT_ELEMENTS_EXAMPLE = 
  `"main entrance: arched doorway, large scale, interior has stone floors, carved walls, ambient light"`;

/**
 * Legacy format specifications - kept for reference but prefer using RULES + EXAMPLE above.
 */
export const DOMINANT_ELEMENTS_FORMAT = {
  /** Format for niches (interior spaces) - simpler since they're not usually enterable */
  niche: `"3-5 major objects/features in this space"`,
  
  /** Format for regions - landmarks and features */
  region: `"3-5 notable features or landmarks in this region"`,
  
  /** Format for host worlds - major defining features */
  host: `"3-5 major landmarks or features that define this world"`
} as const;

// ============================================================================
// DNA JSON TEMPLATE BUILDERS
// ============================================================================

export interface DNATemplateOptions {
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
  const { genreHandling, descLength, nodeType } = options;
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
    "ambient": "${DNA_SCENE_FIELDS.ambient}",`;

  // Genre field based on handling mode
  let genreField: string;
  if (genreHandling === 'host') {
    genreField = `"genre": "${DNA_CASCADING_FIELDS.genre}",`;
  } else if (genreHandling === 'null') {
    genreField = `"genre": null,`;
  } else {
    // conditional based on nodeType
    genreField = nodeType === 'host' 
      ? `"genre": "${DNA_CASCADING_FIELDS.genre}",`
      : `"genre": null,`;
  }

  // Cascading fields (reduced - mood/materials/sounds are in scene fields)
  const cascadingFields = short ? `
    ${genreField}
    "architectural_tone": "${DNA_CASCADING_FIELDS.architectural_tone}",
    "cultural_tone": "${DNA_CASCADING_FIELDS.cultural_tone}",
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias}",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base}",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base}"` : `
    // === CASCADING STYLE ATTRIBUTES (optional - can be null if inherited) ===
    ${genreField}
    "architectural_tone": "${DNA_CASCADING_FIELDS.architectural_tone} OR null to inherit",
    "cultural_tone": "${DNA_CASCADING_FIELDS.cultural_tone} OR null to inherit",
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias} OR null to inherit",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base} OR null to inherit",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base} OR null to inherit"`;

  return `${sceneFields}${cascadingFields}`;
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
   - Cascading fields can be null for inheritance`
};

/**
 * Build combined guidelines string
 */
export function buildGuidelines(): string {
  return `
${DNA_GUIDELINES.sceneVsCascading}

${DNA_GUIDELINES.genreRule}

${DNA_GUIDELINES.outputFormat}`;
}
