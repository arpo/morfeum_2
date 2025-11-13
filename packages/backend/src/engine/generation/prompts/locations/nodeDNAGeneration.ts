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

  const ret = `Interpret the user's description into a simplified, flat DNA structure.

OBJECTIVE: Create a single unified node profile that captures the essential visual and atmospheric qualities without hierarchical complexity.

NODE INFORMATION:
Name: ${nodeName}
Type: ${nodeType}
Description: ${nodeDescription}
${contextSection}
ORIGINAL USER INPUT:
${originalPrompt}

OUTPUT JSON STRUCTURE:

{
  "name": "Concise, evocative name (2-5 words) that sounds like a place name. Avoid meta-words like 'niche', 'space', 'area'. Use articles like 'The' when appropriate. Examples: 'The Sunlit Courtyard', 'Garden Alcove', 'Archway Hall', 'Sculpture Plaza', 'The Reflection Pool'",
  "looks": "2-4 sentences describing what is seen — key forms, layout, and notable features.",
  "colorsAndLighting": "1-3 sentences on dominant colors and light behavior.",
  "atmosphere": "2-4 sentences on air, temperature, motion, weather, and sensory feel.",
  "architectural_tone": "Short phrase (10-20 characters) naming architectural style or era (e.g. 'futuristic metal', 'ancient stone').",
  "cultural_tone": "1 sentence on the social or functional identity (e.g. 'financial district', 'artisan quarter', 'market zone').",
  "materials": "1-3 sentences naming main materials and textures, their condition and finish.",
  "mood": "1-2 sentences on the emotional tone this place evokes.",
  "sounds": "5-7 words listing ambient sounds.",
  "dominantElementsDescriptors": "3-5 defining objects or structures.",
  "spatialLayout": "1-3 sentences on space shape, dimensions, entry points, and focal centers.",
  "primary_surfaces": "Main materials on walls, floor, ceiling.",
  "secondary_surfaces": "Supporting materials on furniture or structure.",
  "accent_features": "Decorative or striking details.",
  "dominant": "Primary color family with coverage area.",
  "secondary": "Secondary color and where it appears.",
  "accent": "Accent colors and placement.",
  "ambient": "Overall light tone (warm / cool / neutral).",
  "uniqueIdentifiers": "2-4 distinctive visual features that make this place recognizable.",
  "searchDesc": "1 concise line (≈75-100 characters) for semantic search: type, function, and key visuals."
}

CRITICAL GUIDELINES

1. **Visual Anchors**
   - Extract anchors directly from the description and user input.
   - Note relative size, position, and proportion of key forms.
   - These anchors guarantee scene continuity and must never be skipped.

2. **Clarity Over Volume**
   - Describe only what can be seen or sensed.
   - One field = one purpose.
   - Avoid repetition or nested metadata.

3. **Intent Fidelity**
   - Keep all user-given names, scales, and moods intact.
   - Honor the originating description's genre and tone when expanding DNA.
${parentContext ? '   - INHERIT parent context attributes (architectural_tone, cultural_tone, colors, mood).\n   - Maintain visual consistency with parent node.' : ''}

4. **Search Description**
   - 75–100 characters max.
   - Start with type or function.
   - End with 1–2 defining visual traits.  
     *Example:* "Weathered stone lighthouse on cliff with spiral stairs."

5. **Output Rules**
   - Flat JSON only.
   - No markdown, code fences, or comments.
   - All schema fields required unless explicitly null.

RATIONALE
- Keeps nodes lightweight and fast to merge.
- Maintains visual consistency across regenerations.
- Ensures user intent and naming survive each cascade.`;
console.log('---- Prompt of for nde DNA LLM ');
console.log(ret);
console.log('------');

  return ret;
}
