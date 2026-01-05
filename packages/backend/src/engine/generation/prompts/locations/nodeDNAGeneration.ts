import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../shared/dnaSchema';
import type { ParentContext } from '../../../hierarchyAnalysis/types';
import { 
  DOMINANT_ELEMENTS_RULES, 
  DOMINANT_ELEMENTS_EXAMPLE,
  DOMINANT_ELEMENTS_FORMAT,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../shared/elementRules';
import { getTransitionCategory } from '../shared/interiorTransitionRules';

/**
 * Node DNA Generation Prompt - Optimized
 * Generates simplified, flat DNA structure for a single node
 */
/**
 * Get specific transition rule based on parent's architectural tone
 */
function getTransitionRuleForParent(parentContext?: ParentContext): string {
  if (!parentContext) return '- No parent context - use sensible defaults for the space type';
  
  const category = getTransitionCategory(parentContext.architectural_tone);
  const tone = parentContext.architectural_tone || 'unknown';
  const materials = parentContext.materials || parentContext.primary_surfaces || 'not specified';
  const colors = parentContext.palette_bias || parentContext.dominant || 'not specified';
  
  switch (category) {
    case 'SAME_MATERIAL':
      return `- SAME_MATERIAL STYLE (${tone}): Interior MUST use identical materials as exterior
  Parent exterior materials: ${materials}
  Parent colors: ${colors}
  → Interior surfaces MUST be the same material family (metallic→metallic, organic→organic)
  → This is a shell structure - the exterior IS the interior`;
      
    case 'EXPOSED_MATERIAL':
      return `- EXPOSED_MATERIAL STYLE (${tone}): Interior shows raw/honest structure
  Parent exterior materials: ${materials}
  → Interior exposes the structural materials (brick, concrete, metal beams, pipes)
  → Raw, industrial aesthetic - don't conceal the structure`;
      
    case 'NATURAL_INTEGRATION':
      return `- NATURAL_INTEGRATION STYLE (${tone}): Built INTO nature
  Parent materials: ${materials}
  → Interior continues natural integration (wood with bark, stone with formations)
  → Cozy but connected to surrounding natural environment`;
      
    case 'FANTASY_SPECIFIC':
      return `- FANTASY STYLE (${tone}): Cultural/magical interior
  Parent colors: ${colors}
  → Interior reflects the cultural nature (stone+tapestries, elven arches, dwarven metal)
  → Mood and atmosphere must match the fantasy genre`;
      
    case 'FINISHED_INTERIOR':
    default:
      return `- FINISHED_INTERIOR STYLE (${tone}): Interior gets appropriate finishes
  Parent exterior: ${materials}
  Parent palette: ${colors}
  → Interior uses typical interior finishes (wallpaper, plaster, wood trim)
  → Colors should HARMONIZE with exterior (not match exactly)
  → NOT the exterior cladding materials inside`;
  }
}

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
═══════════════════════════════════════════════════════════════════
WORLD DNA ANCHORING (ABSOLUTE - 80% preservation required)
═══════════════════════════════════════════════════════════════════
These define the WORLD identity and MUST influence this space:
- Genre: ${parentContext.genre || 'none'}
- Architectural tone: ${parentContext.architectural_tone || 'none'}
- Cultural tone: ${parentContext.cultural_tone || 'none'}
- Palette bias: ${parentContext.palette_bias || 'none'}
- Mood baseline: ${parentContext.mood_baseline || parentContext.mood || 'none'}

CRITICAL BLENDING RULE:
When user requests CONTRASTING concepts (e.g., "whimsical" in post-apocalyptic):
- DO NOT replace world DNA with opposite aesthetics
- BLEND the concepts - the new space must still FEEL like it belongs in this world
- The world's tone should be the foundation, the user's concept is an adaptation

BLENDING EXAMPLES:
- "whimsical house" in post-apocalyptic → colorful salvaged materials, quirky but rough, defiant cheerfulness
  NOT: polished hardwood, pastoral cottage, nature-inspired serenity
- "elegant room" in industrial setting → refined surfaces from industrial materials, polished metal, clean lines
  NOT: ornate Victorian, gilded mirrors, delicate fabrics
- "cozy space" in brutalist world → warm lighting on concrete, soft furnishings on hard surfaces
  NOT: log cabin, rustic wood, country cottage

═══════════════════════════════════════════════════════════════════
PARENT VISUAL CONTEXT (adapt, don't replace):
═══════════════════════════════════════════════════════════════════
- Looks: ${parentContext.looks || 'none'}
- Colors/Lighting: ${parentContext.colorsAndLighting || 'none'}
- Atmosphere: ${parentContext.atmosphere || 'none'}
- Materials: ${parentContext.materials || 'none'}
- Primary surfaces: ${parentContext.primary_surfaces || 'none'}
- Secondary surfaces: ${parentContext.secondary_surfaces || 'none'}
- Accent features: ${parentContext.accent_features || 'none'}
- Dominant color: ${parentContext.dominant || 'none'}
- Secondary color: ${parentContext.secondary || 'none'}
- Accent color: ${parentContext.accent || 'none'}
- Ambient: ${parentContext.ambient || 'none'}
- Flora: ${parentContext.flora_base || 'none'}
- Fauna: ${parentContext.fauna_base || 'none'}

MATERIAL RULES (CRITICAL - Exterior→Interior):
${getTransitionRuleForParent(parentContext)}

INHERITANCE RULES:
- Set cascading fields (genre, architectural_tone, cultural_tone, palette_bias) to null to INHERIT
- Genre MUST be inherited (set to null) - only host defines genre
- Scene fields (looks, materials, mood) should BLEND parent + new concept, not replace entirely
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
    \"looks\": \"${DNA_SCENE_FIELDS.looks}\",
    \"colorsAndLighting\": \"${DNA_SCENE_FIELDS.colorsAndLighting}\",
    \"atmosphere\": \"${DNA_SCENE_FIELDS.atmosphere}\",
    \"materials\": \"${DNA_SCENE_FIELDS.materials}\",
    \"mood\": \"${DNA_SCENE_FIELDS.mood}\",
    \"sounds\": \"${DNA_SCENE_FIELDS.sounds}\",
    \"spatialLayout\": \"${DNA_SCENE_FIELDS.spatialLayout}\",
    \"primary_surfaces\": \"${DNA_SCENE_FIELDS.primary_surfaces}\",
    \"secondary_surfaces\": \"${DNA_SCENE_FIELDS.secondary_surfaces}\",
    \"accent_features\": \"${DNA_SCENE_FIELDS.accent_features}\",
    \"dominant\": \"${DNA_SCENE_FIELDS.dominant}\",
    \"secondary\": \"${DNA_SCENE_FIELDS.secondary}\",
    \"accent\": \"${DNA_SCENE_FIELDS.accent}\",
    \"ambient\": \"${DNA_SCENE_FIELDS.ambient}\",
    \"genre\": ${nodeType === 'host' ? '\"REQUIRED\"' : 'null'},
    \"architectural_tone\": \"${DNA_CASCADING_FIELDS.architectural_tone} or null\",
    \"cultural_tone\": \"${DNA_CASCADING_FIELDS.cultural_tone} or null\",
    \"palette_bias\": \"${DNA_CASCADING_FIELDS.palette_bias} or null\",
    \"flora_base\": \"${DNA_CASCADING_FIELDS.flora_base} or null\",
    \"fauna_base\": \"${DNA_CASCADING_FIELDS.fauna_base} or null\"
  }
}

RULES:
- Scene fields: THIS location's appearance (always populate)
- Cascading fields: Set null to inherit from parent
- Be SPECIFIC (not \"nice\" but \"weathered brass with verdigris\")
- Pure JSON only

CONCRETE DNA RULES (CRITICAL - no abstract concepts):
DO NOT use abstract concepts: \"void\", \"absence\", \"infinite space\", \"nothingness\", \"pure potential\"
ALWAYS describe REAL physical features that can be photographed.

If INTERIOR (inside building/structure):
- Describe walls, floor, ceiling, fixtures, furniture
- Example: \"tall spiraling interior chamber with iridescent metallic wall panels, domed glass ceiling\"
- Match parent's architectural style (metallic tower → metallic interior)

If EXTERIOR (outdoor area):
- Describe ground surface, sky, vegetation, landscape features, terrain
- Example: \"rocky desert clearing with wind-sculpted formations, ochre sand, distant mountains\"
- Include horizon, sky conditions, environmental features

If OPEN-AIR (terrace/balcony/rooftop):
- Describe floor surface, railings/edges, open sky above, views beyond
- Example: \\\"stone terrace with metallic railings, open sky above, panoramic views of the desert below\\\"
- Blend structure and environment - partially enclosed, sky visible

GOTHIC/HORROR GENRES - STILL NEED PHYSICAL DESCRIPTIONS:
Even for haunting, eerie, or atmospheric spaces - describe REAL architectural elements:
✅ CORRECT: \\\"Grand entrance hall with crumbling plaster walls, rotting wood paneling, a dusty marble staircase, cobwebbed chandeliers, faded portraits\\\"
❌ WRONG: \\\"Phantom outline\\\", \\\"oppressive emptiness\\\", \\\"spectral imprint\\\", \\\"ghostly wood trim\\\", \\\"lingering essence\\\"

Gothic decay = PHYSICAL decay:
- Crumbling stone, rotting wood, dusty surfaces, peeling wallpaper, rusted metal
- NOT \\\"phantoms\\\", \\\"essences\\\", \\\"spectral\\\", \\\"ghostly\\\", \\\"intangible void\\\"
The haunting atmosphere comes from the PHYSICAL decay, not abstract poetry.`;
}
