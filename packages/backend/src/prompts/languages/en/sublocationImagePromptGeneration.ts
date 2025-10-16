/**
 * Sublocation Image Prompt Generation
 * LLM converts DNA into optimized FLUX image prompt
 */
import { morfeumVibes, qualityPrompt } from './constants';
import { renderInstructionsGuidance } from './fluxRenderInstructions';

export const sublocationImagePromptGeneration = (
  dna: any,
  cascadedContext: any
) => {
  const dnaJson = JSON.stringify(dna, null, 2);
  const contextJson = JSON.stringify(cascadedContext, null, 2);

  return `You are an expert at creating FLUX image generation prompts for immersive fantasy/sci-fi locations.

TASK: Convert the following sublocation DNA into a single, coherent FLUX image prompt.

SUBLOCATION DNA:
${dnaJson}

CASCADED WORLD CONTEXT:
${contextJson}

INSTRUCTIONS:
${renderInstructionsGuidance}
- Create a vivid, detailed FLUX prompt that captures the essence of this sublocation
- Include visual anchors (dominant elements, spatial layout, materials, colors)
- Incorporate the atmosphere, mood, and symbolic themes
- Reference the world context (genre, architectural tone, palette)
- Use rich, evocative language
- Be specific and concrete, avoid generic terms
- Ensure the scene is coherent and visually engaging

STRUCTURE YOUR PROMPT:
1. Start with: "${morfeumVibes}"
2. Location name and key visual details
3. Atmosphere and mood
4. Materials and surfaces
5. Colors and lighting
6. Visual anchors and spatial layout
7. Symbolic themes and unique identifiers
8. World context elements (genre, architectural style)
9. End with quality guidelines

WORLD RULES TO INCLUDE:
- No human or animal figures appear unless explicitly mentioned
- Water, when visible, is calm and mirror-still, reflecting light softly

QUALITY DIRECTIVE TO ADD AT END:
${qualityPrompt}

OUTPUT: Return ONLY the final FLUX image prompt as plain text, no explanations or JSON.`;
};
