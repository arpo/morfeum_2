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

export type NodeType = 'host' | 'region' | 'location' | 'niche';

export interface DNATemplateOptions {
  /** Whether to include structure field (locations only) */
  includeStructure: boolean;
  /** How to handle genre: 'host' = set value, 'null' = always null, 'conditional' = based on nodeType */
  genreHandling: 'host' | 'null' | 'conditional';
  /** Node type for conditional handling */
  nodeType?: string;
}

/**
 * Build scene fields string (always the same for all node types)
 */
function buildSceneFieldsString(): string {
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
    "ambient": "${DNA_SCENE_FIELDS.ambient}",`;
}

/**
 * Build cascading fields string based on node type
 * Host: All fields required
 * Others: All fields nullable (for inheritance)
 */
function buildCascadingFieldsString(nodeType: NodeType): string {
  if (nodeType === 'host') {
    return `
    "genre": "REQUIRED: ${DNA_CASCADING_FIELDS.genre}",
    "architectural_tone": "REQUIRED: ${DNA_CASCADING_FIELDS.architectural_tone}",
    "cultural_tone": "REQUIRED: ${DNA_CASCADING_FIELDS.cultural_tone}",
    "materials_base": "REQUIRED: ${DNA_CASCADING_FIELDS.materials_base}",
    "mood_baseline": "REQUIRED: ${DNA_CASCADING_FIELDS.mood_baseline}",
    "palette_bias": "REQUIRED: ${DNA_CASCADING_FIELDS.palette_bias}",
    "soundscape_base": "REQUIRED: ${DNA_CASCADING_FIELDS.soundscape_base}",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base}",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base}"`;
  }
  
  // For non-host nodes: genre is always null, others are nullable
  return `
    "genre": null,
    "architectural_tone": "${DNA_CASCADING_FIELDS.architectural_tone} OR null to inherit",
    "cultural_tone": "${DNA_CASCADING_FIELDS.cultural_tone} OR null to inherit",
    "materials_base": "${DNA_CASCADING_FIELDS.materials_base} OR null to inherit",
    "mood_baseline": "${DNA_CASCADING_FIELDS.mood_baseline} OR null to inherit",
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias} OR null to inherit",
    "soundscape_base": "${DNA_CASCADING_FIELDS.soundscape_base} OR null to inherit",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base} OR null to inherit",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base} OR null to inherit"`;
}

/**
 * Build the DNA fields section for JSON templates
 */
export function buildDNAFieldsString(options: DNATemplateOptions): string {
  const { includeStructure, nodeType = 'niche' } = options;
  
  const sceneFields = buildSceneFieldsString();
  
  const structureField = includeStructure 
    ? `
    ${buildStructureSchemaString()},`
    : `
    "structure": null,`;

  const cascadingFields = buildCascadingFieldsString(nodeType as NodeType);

  return `${sceneFields}${structureField}${cascadingFields}`;
}

/**
 * Build complete DNA JSON template for a specific node type
 * This is the main function for generating DNA prompts
 */
export function buildDNAJsonTemplate(nodeType: NodeType): string {
  const includeStructure = nodeType === 'location';
  
  return `{
  "name": "Evocative name for this ${nodeType}",
  "description": "2-3 sentence description",
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window", "position": "location in scene", "description": "what it is"}
  ],
  "dominantElements": ["3-5 major visual features"],
  "uniqueIdentifiers": ["3-5 distinctive features"],
  "searchDesc": "75-100 char search description",
  "slug": "kebab-case-name",
  "dna": {${buildDNAFieldsString({ includeStructure, genreHandling: 'conditional', nodeType })}
  }
}`;
}

/**
 * Build parent context section for prompts
 */
export function buildParentContextSection(parentContext?: {
  genre?: string;
  architectural_tone?: string;
  cultural_tone?: string;
  dominant?: string;
  mood?: string;
  materials_base?: string;
  palette_bias?: string;
}): string {
  if (!parentContext) return '';
  
  return `
PARENT CONTEXT (inherit and respect these attributes):
- Genre: ${parentContext.genre || 'Not specified'} (NEVER override genre)
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Dominant Color: ${parentContext.dominant || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}
- Materials Base: ${parentContext.materials_base || 'Not specified'}
- Palette Bias: ${parentContext.palette_bias || 'Not specified'}
`;
}

/**
 * Build node-type specific guidelines
 */
export function buildNodeTypeGuidelines(nodeType: NodeType): string {
  const guidelines: Record<NodeType, string> = {
    host: `
HOST NODE GUIDELINES:
1. **GENRE is REQUIRED**: Host is the ONLY node that sets genre. All children inherit it.
2. **All cascading fields are REQUIRED**: Host must define ALL style attributes.
3. **Be Foundational**: These attributes cascade to all children.
4. **Think Scale**: Host represents the largest scope.`,
    
    region: `
REGION NODE GUIDELINES:
1. **GENRE is ALWAYS null**: Region NEVER sets genre - it inherits from host.
2. **Sparse Cascading Fields**: Only set if DISTINCTLY different from parent.
3. **Maintain Consistency**: Stay within the world's genre and style.`,
    
    location: `
LOCATION NODE GUIDELINES:
1. **GENRE is ALWAYS null**: Location NEVER sets genre.
2. **NavigableElements are ESSENTIAL**: List ALL visible entrances, passages, stairs.
3. **Exterior Focus**: Location DNA describes the OUTSIDE of a building.
4. **Structure is REQUIRED**: Must populate structure for buildings.`,
    
    niche: `
NICHE NODE GUIDELINES:
1. **GENRE is ALWAYS null**: Niche NEVER sets genre.
2. **ALL CASCADING FIELDS are null**: Niche fully inherits parent style.
3. **IMMERSIVE DETAIL**: Be highly specific - this is where the user IS.
4. **NavigableElements for Expansion**: Doors, passages that lead elsewhere.`
  };
  
  return guidelines[nodeType];
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
