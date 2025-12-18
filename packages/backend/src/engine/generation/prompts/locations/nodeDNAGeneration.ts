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
  
  // Use full parent context for both GO_INSIDE and GOTO commands
  // This ensures proper world context (e.g., "on The Moon") is passed for all navigation
  const contextSection = parentContext 
    ? `
PARENT CONTEXT (inherit unless overriding):
- Genre: ${parentContext.genre || 'none'}
- Looks: ${parentContext.looks || 'none'}
- Colors/Lighting: ${parentContext.colorsAndLighting || 'none'}
- Atmosphere: ${parentContext.atmosphere || 'none'}
- Materials: ${parentContext.materials || 'none'}
- Mood: ${parentContext.mood || 'none'}
- Architectural tone: ${parentContext.architectural_tone || 'none'}
- Cultural tone: ${parentContext.cultural_tone || 'none'}
- Palette: ${parentContext.palette_bias || 'none'}
- Primary surfaces: ${parentContext.primary_surfaces || 'none'}
- Secondary surfaces: ${parentContext.secondary_surfaces || 'none'}
- Accent features: ${parentContext.accent_features || 'none'}
- Dominant color: ${parentContext.dominant || 'none'}
- Secondary color: ${parentContext.secondary || 'none'}
- Accent color: ${parentContext.accent || 'none'}
- Ambient: ${parentContext.ambient || 'none'}
- Flora: ${parentContext.flora_base || 'none'}
- Fauna: ${parentContext.fauna_base || 'none'}

MATERIAL RULES:
- Exterior→Exterior: KEEP same facade
- Exterior→Interior: TRANSFORM facade to interior finish (wood facade→plaster/wallpaper, stone→keep for grand spaces)
- User-specified surfaces override all

INHERITANCE RULES:
- Set field to null to INHERIT from parent
- Only override when the new space has DIFFERENT characteristics
- Genre MUST be inherited (set to null) - only host defines genre
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
