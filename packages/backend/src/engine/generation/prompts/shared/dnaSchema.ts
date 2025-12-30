/**
 * Shared DNA Schema Definitions - Optimized
 * Single source of truth for DNA field descriptions and JSON templates
 */

// ============================================================================
// DNA FIELD DESCRIPTIONS (Compact)
// ============================================================================

export const DNA_SCENE_FIELDS = {
  looks: '2-4 sentences: forms, layout, scale, features',
  colorsAndLighting: '1-3 sentences: colors, light sources, shadows',
  atmosphere: '2-4 sentences: air, temperature, motion, weather',
  materials: '1-3 sentences: materials, textures, condition',
  mood: '1-2 sentences: emotional tone',
  sounds: '5-10 words: ambient sounds',
  spatialLayout: '1-3 sentences: shape, dimensions, depth',
  primary_surfaces: 'Main surfaces with adjectives',
  secondary_surfaces: 'Supporting materials',
  accent_features: 'Decorative/eye-catching details',
  dominant: 'Primary color + area',
  secondary: 'Secondary color + placement',
  accent: 'Accent colors + placement',
  ambient: 'Overall light tone'
} as const;

export const DNA_CASCADING_FIELDS = {
  genre: 'World genre (cyberpunk, fantasy) - HOST ONLY',
  architectural_tone: 'Style phrase (e.g., \"weathered Victorian\")',
  cultural_tone: 'Who uses this, purpose',
  palette_bias: 'Color families',
  flora_base: 'Plant life or \"None\"',
  fauna_base: 'Animal life or \"None\"'
} as const;

// ============================================================================
// DNA JSON TEMPLATE BUILDER
// ============================================================================

export interface DNATemplateOptions {
  genreHandling: 'host' | 'null' | 'conditional';
  descLength: 'short' | 'long';
  nodeType?: string;
}

/**
 * Build DNA fields section for JSON templates
 */
export function buildDNAFieldsString(options: DNATemplateOptions): string {
  const { genreHandling, nodeType } = options;
  
  const genreField = genreHandling === 'host' || (genreHandling === 'conditional' && nodeType === 'host')
    ? `"genre": "${DNA_CASCADING_FIELDS.genre}",`
    : `"genre": null,`;

  return `
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
    "ambient": "${DNA_SCENE_FIELDS.ambient}",
    ${genreField}
    "architectural_tone": "${DNA_CASCADING_FIELDS.architectural_tone} or null",
    "cultural_tone": "${DNA_CASCADING_FIELDS.cultural_tone} or null",
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias} or null",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base} or null",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base} or null"`;
}

// ============================================================================
// COMMON GUIDELINES
// ============================================================================

export const DNA_GUIDELINES = {
  sceneVsCascading: `Scene fields: THIS location's appearance. Cascading fields: style that produces similar children.`,
  genreRule: `Genre: ONLY host sets it. All others: null.`,
  outputFormat: `Pure JSON only. All scene fields required. Cascading can be null.`
};

export function buildGuidelines(): string {
  return `${DNA_GUIDELINES.sceneVsCascading}\n${DNA_GUIDELINES.genreRule}\n${DNA_GUIDELINES.outputFormat}`;
}
