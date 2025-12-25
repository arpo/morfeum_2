/**
 * World Tree Context Prompt Builder
 * 
 * Creates a CONTEXT prompt that is sent to an LLM to generate the actual FLUX image description.
 * This mirrors the approach used in nicheImagePrompt.ts for better quality images.
 * 
 * Step 1: Build detailed context prompt with ALL DNA + composition instructions
 * Step 2: LLM generates the actual FLUX image description (in pipeline)
 */

import { fluxInstructionsShort } from '../../shared/constants';
import { getCompositionInstructions } from './compositionInstructions';
import type { NodeDNA } from '../../../../hierarchyAnalysis/types';

export interface WorldTreeImagePromptParams {
  nodeType: 'host' | 'region' | 'location' | 'niche';
  nodeName: string;
  dna: Partial<NodeDNA>;
  originalPrompt: string;
  parentChain: Array<{
    type: string;
    name: string;
    description: string;
  }>;
}

/**
 * Generate CONTEXT prompt for LLM to create FLUX image description
 * This is sent to an LLM which then generates the actual FLUX prompt
 */
export function worldTreeImagePromptContext(params: WorldTreeImagePromptParams): string {
  const { nodeType, nodeName, dna, originalPrompt, parentChain } = params;
  
  // Get appropriate composition instructions based on node type
  const compositionInstructions = getCompositionInstructions(nodeType);
  
  // Build parent context
  const parentContext = parentChain.length > 0
    ? parentChain.map(p => `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} "${p.name}": ${p.description}`).join('\n')
    : 'No parent context (this is the root node)';

  const prompt = `
You are an expert at creating image prompts for FLUX image generation.

USER'S ORIGINAL REQUEST:
"${originalPrompt}"

NODE TO VISUALIZE:
Type: ${nodeType}
Name: "${nodeName}"

PARENT CONTEXT (for world coherence):
${parentContext}

${compositionInstructions}

=== SCENE-SPECIFIC DETAILS (from DNA) ===
${dna.looks ? `Looks: ${dna.looks}` : ''}
${dna.spatialLayout ? `Spatial Layout: ${dna.spatialLayout}` : ''}
${dna.atmosphere ? `Atmosphere: ${dna.atmosphere}` : ''}
${dna.colorsAndLighting ? `Colors & Lighting: ${dna.colorsAndLighting}` : ''}
${dna.materials ? `Materials: ${dna.materials}` : ''}
${dna.mood ? `Mood: ${dna.mood}` : ''}
${dna.sounds ? `Sounds (for atmosphere hints): ${dna.sounds}` : ''}

Material Surface Breakdown:
${dna.primary_surfaces ? `Primary Surfaces: ${dna.primary_surfaces}` : ''}
${dna.secondary_surfaces ? `Secondary Surfaces: ${dna.secondary_surfaces}` : ''}
${dna.accent_features ? `Accent Features: ${dna.accent_features}` : ''}

Color Palette Breakdown:
${dna.dominant ? `Dominant Colors: ${dna.dominant}` : ''}
${dna.secondary ? `Secondary Colors: ${dna.secondary}` : ''}
${dna.accent ? `Accent Colors: ${dna.accent}` : ''}
${dna.ambient ? `Ambient Light: ${dna.ambient}` : ''}

${dna.genre ? `Genre: ${dna.genre}` : ''}

${dna.architectural_tone ? `
ARCHITECTURAL TONE (CRITICAL - MUST MATCH EXACTLY): ${dna.architectural_tone}
The building/environment MUST reflect this architectural style in ALL visible details (facade, windows, doors, decorative elements, materials, finishes).` : ''}

${dna.cultural_tone ? `Cultural Tone: ${dna.cultural_tone}` : ''}
${dna.mood_baseline ? `Mood Baseline: ${dna.mood_baseline}` : ''}
${dna.materials_base ? `Materials Base Style: ${dna.materials_base}` : ''}
${dna.palette_bias ? `Palette Bias Style: ${dna.palette_bias}` : ''}

${fluxInstructionsShort}

REQUIREMENTS:
1. Create a detailed, vivid image prompt that captures ALL the DNA details above
2. The image should be visually interesting with ASYMMETRIC composition
3. Include environmental context and atmosphere
4. Match the architectural_tone EXACTLY in all visible architectural details
5. Use the color palette breakdown to inform the visual

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should be rich, specific, and capture the unique character of this ${nodeType}.
`;

  return prompt;
}
