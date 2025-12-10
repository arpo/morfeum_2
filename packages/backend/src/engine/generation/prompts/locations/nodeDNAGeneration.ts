import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../shared/dnaSchema';
import type { ParentContext } from '../../../hierarchyAnalysis/types';

/**
 * Node DNA Generation Prompt
 * 
 * Generates simplified, flat DNA structure for a single node
 * Now accepts FULL parent DNA for CSS-like inheritance
 * 
 * NOTE: Structure is now a separate node property, not part of DNA.
 * 
 * @param originalPrompt - Original user input
 * @param nodeName - Name of the node to generate DNA for
 * @param nodeType - Type of node (host, region, location, niche, detail)
 * @param nodeDescription - Description of the node
 * @param parentContext - Full parent DNA to inherit from (CSS-like cascade)
 * @returns Prompt string for LLM
 */
export function nodeDNAGeneration(
  originalPrompt: string,
  nodeName: string,
  nodeType: string,
  nodeDescription: string,
  parentContext?: ParentContext
): string {
  // Build comprehensive parent context section from ALL parent DNA fields
  const contextSection = parentContext 
    ? `
PARENT CONTEXT (CSS-like inheritance - inherit ALL these attributes unless overriding):
=== VISUAL STYLE ===
- Looks: ${parentContext.looks || 'Not specified'}
- Colors & Lighting: ${parentContext.colorsAndLighting || 'Not specified'}
- Atmosphere: ${parentContext.atmosphere || 'Not specified'}
- Materials: ${parentContext.materials || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}

=== SURFACES ===
- Primary Surfaces: ${parentContext.primary_surfaces || 'Not specified'}
- Secondary Surfaces: ${parentContext.secondary_surfaces || 'Not specified'}
- Accent Features: ${parentContext.accent_features || 'Not specified'}

=== COLORS ===
- Dominant: ${parentContext.dominant || 'Not specified'}
- Secondary: ${parentContext.secondary || 'Not specified'}
- Accent: ${parentContext.accent || 'Not specified'}
- Ambient Light: ${parentContext.ambient || 'Not specified'}

=== CASCADING STYLE (MUST inherit unless distinctly different) ===
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Materials Base: ${parentContext.materials_base || 'Not specified'}
- Mood Baseline: ${parentContext.mood_baseline || 'Not specified'}
- Palette Bias: ${parentContext.palette_bias || 'Not specified'}
- Soundscape Base: ${parentContext.soundscape_base || 'Not specified'}
- Flora Base: ${parentContext.flora_base || 'Not specified'}
- Fauna Base: ${parentContext.fauna_base || 'Not specified'}

CRITICAL MATERIAL INHERITANCE RULES:
1. Child spaces MUST use the SAME WALL MATERIALS as the parent - the function changes, not the building materials.
2. You are ADAPTING the parent's visual style to a new function - NOT replacing it with a generic style.
3. The child's "looks", "materials", and "primary_surfaces" fields MUST incorporate the parent's materials.
4. Only ADD function-specific fixtures and equipment - do NOT REPLACE the parent's wall/floor/ceiling materials.
5. The building's architectural character (materials, textures, aging) must be preserved in all child spaces.

KEY PRINCIPLE: Function changes, building materials don't.
WRONG: Replacing parent's wall materials with generic function-appropriate materials
RIGHT: Adding function-specific fixtures while KEEPING the parent's wall materials
`
    : '';

  const ret = `Interpret the user's description into a DNA structure with cascading style attributes.

OBJECTIVE: Create visual/atmospheric DNA that separates scene-specific details from inheritable style attributes.

NODE INFORMATION:
Name: ${nodeName}
Type: ${nodeType}
Description: ${nodeDescription}
${contextSection}
ORIGINAL USER INPUT:
${originalPrompt}

OUTPUT JSON STRUCTURE:

{
  "name": "${nodeName}",
  "description": "Brief description of this node",
  
  // === STRUCTURAL FIELDS (metadata and navigation) ===
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window", "position": "location in scene", "description": "what it is"}
  ],
  "dominantElements": ["List of major positioned objects/features in scene"],
  "uniqueIdentifiers": ["List of distinctive visual features that make this place recognizable"],
  "searchDesc": "75-100 char search-friendly description",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  
  // === DNA: SCENE-SPECIFIC VISUAL FIELDS (always populated) ===
  "dna": {
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
    
    // === CASCADING STYLE ATTRIBUTES (optional - can be null if inherited from parent) ===
    "genre": null,  // NEVER set genre - only host nodes have this
    "architectural_tone": "${DNA_CASCADING_FIELDS.architectural_tone} OR null to inherit",
    "cultural_tone": "${DNA_CASCADING_FIELDS.cultural_tone} OR null to inherit",
    "materials_base": "${DNA_CASCADING_FIELDS.materials_base} OR null to inherit",
    "mood_baseline": "${DNA_CASCADING_FIELDS.mood_baseline} OR null to inherit",
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias} OR null to inherit",
    "soundscape_base": "${DNA_CASCADING_FIELDS.soundscape_base} OR null to inherit",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base} OR null to inherit",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base} OR null to inherit"
  }
}

CRITICAL GUIDELINES

1. **Scene vs. Cascading Fields**
   - Scene fields: Describe THIS specific location's appearance (looks, colors, materials visible)
   - Cascading fields: General style that could produce similar children (architectural style, color palette bias)
   - Example: Scene "polished chrome walls" → Cascade "industrial metallic aesthetic"

2. **Visual Anchors**
   - Extract anchors directly from the description and user input
   - Note relative size, position, and proportion of key forms
   - These anchors guarantee scene continuity

3. **Cascading Inheritance**
   - NEVER set "genre" field (only host nodes have this)
${parentContext ? '   - Parent provides: architectural_tone, cultural_tone, colors, mood\n   - Only override cascading fields if THIS node is distinctly different\n   - Set to null to inherit parent value\n   - Maintain visual consistency with parent' : '   - Set cascading fields only if this node has distinct style characteristics\n   - Use null to indicate no specific style override'}

4. **Clarity Over Volume**
   - Describe only what can be seen or sensed
   - One field = one purpose
   - Avoid repetition across fields

5. **Output Rules**
   - Flat JSON only (no markdown, code fences, or comments)
   - All scene fields required
   - Cascading fields can be null for inheritance

RATIONALE
- Separates scene details from inheritable style
- Enables efficient DNA cascade through hierarchy
- Maintains visual consistency across regenerations
- Supports sparse child DNA (only override what's different)`;

  return ret;
}
