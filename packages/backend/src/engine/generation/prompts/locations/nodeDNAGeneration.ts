import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../shared/dnaSchema';
import type { ParentContext } from '../../../hierarchyAnalysis/types';
import { 
  DOMINANT_ELEMENTS_RULES, 
  DOMINANT_ELEMENTS_EXAMPLE,
  DOMINANT_ELEMENTS_FORMAT,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../shared/elementRules';

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
  options?: { isGotoCommand?: boolean }
): string {
  const needsStructuralFields = nodeType === 'location' || nodeType === 'niche' || nodeType === 'detail';
  
  // For GOTO commands, parent context is STYLE ONLY (don't let parent content dominate)
  // For GO_INSIDE (default), clarify that we're ENTERING a target structure
  const contextSection = parentContext 
    ? options?.isGotoCommand 
      ? `
STYLE CONTEXT (for visual consistency only - do NOT copy parent content):
- Architectural tone: ${parentContext.architectural_tone || 'none'}
- Palette: ${parentContext.palette_bias || 'none'}

IMPORTANT: Create the location described in USER INPUT.
The parent context provides STYLE/ATMOSPHERE only, not what to create.
`
      : `
TARGET STRUCTURE: You are ENTERING the structure described in USER INPUT below.
Create DNA for the space WITHIN that target - NOT the parent space.

PARENT CONTEXT (for style inheritance only - do NOT recreate parent):
- Architectural tone: ${parentContext.architectural_tone || 'none'}
- Cultural tone: ${parentContext.cultural_tone || 'none'}
- Palette: ${parentContext.palette_bias || 'none'}
- Materials: ${parentContext.materials || 'none'}

MATERIAL RULES:
- Exterior→Interior: TRANSFORM facade to interior finish (wood facade→plaster/wallpaper, stone→keep for grand)
- User-specified surfaces override all
`
    : '';

  const structuralFields = needsStructuralFields ? `\"navigableElements\": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
  \"dominantElements\": [${nodeType === 'location' ? DOMINANT_ELEMENTS_EXAMPLE : DOMINANT_ELEMENTS_FORMAT.niche}],
  \"uniqueIdentifiers\": [\"2-4 distinctive features\"],` : '';

  // Build element rules section for location/niche
  const elementRulesSection = needsStructuralFields
    ? `\n${NAVIGABLE_ELEMENTS_RULES}\n\n${nodeType === 'location' ? DOMINANT_ELEMENTS_RULES : ''}\n`
    : '';

  return `Generate DNA for ${nodeType} \"${nodeName}\".

DESC: ${nodeDescription}
USER: ${originalPrompt}
${contextSection}${elementRulesSection}
OUTPUT (pure JSON):
{
  \"name\": \"${nodeName}\",
  \"description\": \"Brief description\",
  ${structuralFields}
  \"searchDesc\": \"75-100 chars\",
  \"slug\": \"${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\",
  \"dna\": {
    \"looks\": \"visual description\",
    \"colorsAndLighting\": \"colors and light\",
    \"atmosphere\": \"air, temp, motion\",
    \"materials\": \"main materials\",
    \"mood\": \"emotional tone\",
    \"sounds\": \"5-10 words\",
    \"spatialLayout\": \"space shape\",
    \"primary_surfaces\": \"main surfaces\",
    \"secondary_surfaces\": \"supporting materials\",
    \"accent_features\": \"decorative details\",
    \"dominant\": \"primary color\",
    \"secondary\": \"secondary color\",
    \"accent\": \"accent color\",
    \"ambient\": \"light tone\",
    \"genre\": ${nodeType === 'host' ? '\"REQUIRED\"' : 'null'},
    \"architectural_tone\": \"style or null\",
    \"cultural_tone\": \"who uses or null\",
    \"palette_bias\": \"colors or null\",
    \"flora_base\": \"plants or null\",
    \"fauna_base\": \"animals or null\"
  }
}

RULES:
- Scene fields: THIS location's appearance (always populate)
- Cascading fields: Set null to inherit from parent
- Be SPECIFIC (not \"nice\" but \"weathered brass with verdigris\")
- Pure JSON only`;
}
