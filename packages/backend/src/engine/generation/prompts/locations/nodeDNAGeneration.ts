import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../shared/dnaSchema';
import type { ParentContext } from '../../../hierarchyAnalysis/types';

/**
 * Node DNA Generation Prompt - Optimized
 * Generates simplified, flat DNA structure for a single node
 */
export function nodeDNAGeneration(
  originalPrompt: string,
  nodeName: string,
  nodeType: string,
  nodeDescription: string,
  parentContext?: ParentContext,
  options?: { isGotoCommand?: boolean; hasSpecificTarget?: boolean; targetObject?: string }
): string {
  const needsStructuralFields = nodeType === 'location' || nodeType === 'niche' || nodeType === 'detail';
  
  // Special case: GO_INSIDE with specific target (e.g., "alien spaceship")
  // Use target name and focus on target interior
  const effectiveName = options?.hasSpecificTarget && options?.targetObject
    ? `Interior of ${options.targetObject}`
    : nodeName;
  
  // For GO_INSIDE with target OR GOTO commands, parent context is STYLE ONLY
  const contextSection = parentContext 
    ? (options?.isGotoCommand || options?.hasSpecificTarget)
      ? `
STYLE CONTEXT (for visual consistency only - do NOT copy parent content):
- Architectural tone: ${parentContext.architectural_tone || 'none'}
- Palette: ${parentContext.palette_bias || 'none'}

IMPORTANT: Create the location described in USER INPUT.
The parent context provides STYLE/ATMOSPHERE only, not what to create.
`
      : `
PARENT CONTEXT (inherit unless overriding):
- Looks: ${parentContext.looks || 'none'}
- Materials: ${parentContext.materials || 'none'}
- Architectural tone: ${parentContext.architectural_tone || 'none'}
- Cultural tone: ${parentContext.cultural_tone || 'none'}
- Palette: ${parentContext.palette_bias || 'none'}

MATERIAL RULES:
- Exterior→Exterior: KEEP same facade
- Exterior→Interior: TRANSFORM facade to interior finish (wood facade→plaster/wallpaper, stone→keep for grand spaces)
- User-specified surfaces override all
`
    : '';

  // Compact dominantElements rules - placed close to JSON for LLM attention
  const dominantElementsRules = needsStructuralFields ? `
DOMINANTELEMENTS (CRITICAL - for GO_INSIDE support):
- ONLY physically enterable structures (doors, buildings, vehicles, portals, caves)
- NEVER include: trees, decorations, terrain, patterns, atmosphere
- FORMAT: "[name]: [shape], [scale], interior has [floor], [walls], [lighting]"
- Return empty array [] if nothing is enterable
` : '';

  const structuralFields = needsStructuralFields ? `"navigableElements": [{"type": "door|passage|stairs", "position": "where", "description": "brief"}],
  "dominantElements": ["temple entrance: stone archway, large scale, interior has marble floors, carved walls with murals, filtered light"],
  "uniqueIdentifiers": ["2-4 distinctive features"],` : '';

  return `Generate DNA for ${nodeType} "${effectiveName}".

DESC: ${nodeDescription}
USER: ${originalPrompt}
${contextSection}
${dominantElementsRules}
OUTPUT (pure JSON):
{
  "name": "${effectiveName}",
  "description": "Brief description",
  ${structuralFields}
  "searchDesc": "75-100 chars",
  "slug": "${effectiveName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "dna": {
    "looks": "visual description",
    "colorsAndLighting": "colors and light",
    "atmosphere": "air, temp, motion",
    "materials": "main materials",
    "mood": "emotional tone",
    "sounds": "5-10 words",
    "spatialLayout": "space shape",
    "primary_surfaces": "main surfaces",
    "secondary_surfaces": "supporting materials",
    "accent_features": "decorative details",
    "dominant": "primary color",
    "secondary": "secondary color",
    "accent": "accent color",
    "ambient": "light tone",
    "genre": ${nodeType === 'host' ? '"REQUIRED"' : 'null'},
    "architectural_tone": "style or null",
    "cultural_tone": "who uses or null",
    "palette_bias": "colors or null",
    "flora_base": "plants or null",
    "fauna_base": "animals or null"
  }
}

RULES:
- Scene fields: THIS location's appearance (always populate)
- Cascading fields: Set null to inherit from parent
- Be SPECIFIC (not "nice" but "weathered brass with verdigris")
- Pure JSON only`;
}
