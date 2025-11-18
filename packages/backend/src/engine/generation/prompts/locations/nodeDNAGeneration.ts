/**
 * Node DNA Generation Prompt
 * 
 * Generates simplified, flat DNA structure for a single node
 * 
 * @param originalPrompt - Original user input
 * @param nodeName - Name of the node to generate DNA for
 * @param nodeType - Type of node (host, region, location, niche, detail)
 * @param nodeDescription - Description of the node
 * @param parentContext - Optional parent context to inherit from
 * @returns Prompt string for LLM
 */
export function nodeDNAGeneration(
  originalPrompt: string,
  nodeName: string,
  nodeType: string,
  nodeDescription: string,
  parentContext?: {
    architectural_tone?: string;
    cultural_tone?: string;
    dominant?: string;
    mood?: string;
  }
): string {
  const contextSection = parentContext 
    ? `
PARENT CONTEXT (inherit and respect these attributes):
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Dominant Color: ${parentContext.dominant || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}
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
  "ambient": "Overall light tone (warm / cool / neutral).",
  
  // === CASCADING STYLE ATTRIBUTES (optional - can be null if inherited from parent) ===
  "genre": null,  // NEVER set genre - only host nodes have this
  "architectural_tone": "Short phrase (e.g., 'industrial metallic', 'organic stone') OR null to inherit",
  "cultural_tone": "1 sentence on social/functional identity OR null to inherit",
  "materials_base": "Material palette/style (NOT specific objects) OR null to inherit",
  "mood_baseline": "Emotional baseline OR null to inherit",
  "palette_bias": "Color style/families (NOT specific scene colors) OR null to inherit",
  "soundscape_base": "Ambient sound style OR null to inherit",
  "flora_base": "Plant life types OR 'None' OR null to inherit",
  "fauna_base": "Animal life types OR 'None' OR null to inherit"
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
// console.log('---- Prompt of for nde DNA LLM ');
// console.log(ret);
// console.log('------');

  return ret;
}
