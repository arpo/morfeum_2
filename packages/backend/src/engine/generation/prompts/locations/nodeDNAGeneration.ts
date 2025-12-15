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
  parentContext?: ParentContext
): string {
  const needsStructuralFields = nodeType === 'location' || nodeType === 'niche' || nodeType === 'detail';
  
  const contextSection = parentContext 
    ? `
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

  const structuralFields = needsStructuralFields ? `"navigableElements": [{"type": "door|passage|stairs", "position": "where", "description": "brief"}],
  "dominantElements": ["3-5 main features"],
  "uniqueIdentifiers": ["2-4 distinctive features"],` : '';

  return `Generate DNA for ${nodeType} "${nodeName}".

DESC: ${nodeDescription}
USER: ${originalPrompt}
${contextSection}
OUTPUT (pure JSON):
{
  "name": "${nodeName}",
  "description": "Brief description",
  ${structuralFields}
  "searchDesc": "75-100 chars",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
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
