/**
 * World Tree Context Prompt Builder - Optimized
 * Creates CONTEXT prompt for LLM to generate FLUX image description.
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
 */
export function worldTreeImagePromptContext(params: WorldTreeImagePromptParams): string {
  const { nodeType, nodeName, dna, originalPrompt, parentChain } = params;
  
  const compositionInstructions = getCompositionInstructions(nodeType);
  
  const parentContext = parentChain.length > 0
    ? parentChain.map(p => `${p.type}: "${p.name}" - ${p.description}`).join('\n')
    : 'Root node';

  // Build DNA section - only include non-empty fields
  const dnaLines: string[] = [];
  if (dna.looks) dnaLines.push(`Looks: ${dna.looks}`);
  if (dna.spatialLayout) dnaLines.push(`Layout: ${dna.spatialLayout}`);
  if (dna.atmosphere) dnaLines.push(`Atmosphere: ${dna.atmosphere}`);
  if (dna.colorsAndLighting) dnaLines.push(`Colors: ${dna.colorsAndLighting}`);
  if (dna.materials) dnaLines.push(`Materials: ${dna.materials}`);
  if (dna.mood) dnaLines.push(`Mood: ${dna.mood}`);
  if (dna.sounds) dnaLines.push(`Sounds: ${dna.sounds}`);
  
  // Material breakdown
  const materialLines: string[] = [];
  if (dna.primary_surfaces) materialLines.push(`Primary: ${dna.primary_surfaces}`);
  if (dna.secondary_surfaces) materialLines.push(`Secondary: ${dna.secondary_surfaces}`);
  if (dna.accent_features) materialLines.push(`Accents: ${dna.accent_features}`);
  
  // Color palette
  const colorLines: string[] = [];
  if (dna.dominant) colorLines.push(`Dominant: ${dna.dominant}`);
  if (dna.secondary) colorLines.push(`Secondary: ${dna.secondary}`);
  if (dna.accent) colorLines.push(`Accent: ${dna.accent}`);
  if (dna.ambient) colorLines.push(`Ambient: ${dna.ambient}`);
  
  // Style fields
  const styleLines: string[] = [];
  if (dna.genre) styleLines.push(`Genre: ${dna.genre}`);
  if (dna.architectural_tone) styleLines.push(`ARCHITECTURAL TONE (CRITICAL): ${dna.architectural_tone}`);
  if (dna.cultural_tone) styleLines.push(`Cultural: ${dna.cultural_tone}`);
  if (dna.palette_bias) styleLines.push(`Palette: ${dna.palette_bias}`);

  return `FLUX image prompt expert.

USER REQUEST: "${originalPrompt}"

NODE: ${nodeType} "${nodeName}"

PARENT CONTEXT:
${parentContext}

${compositionInstructions}

=== DNA ===
${dnaLines.join('\n')}

${materialLines.length > 0 ? `Materials: ${materialLines.join(', ')}` : ''}
${colorLines.length > 0 ? `Colors: ${colorLines.join(', ')}` : ''}
${styleLines.length > 0 ? styleLines.join('\n') : ''}

${fluxInstructionsShort}

REQUIREMENTS:
1. Capture ALL DNA details. ASYMMETRIC composition.
2. Match architectural_tone in ALL visible elements.
3. Describe layers: foreground → midground → background

OUTPUT JSON:
{
  "background": "Distant elements: sky, horizon, environmental context",
  "midground": "Central focus: main structures, primary subject",
  "foreground": "Closest elements: objects, details near viewer",
  "lighting": "Light direction, quality, layer effects",
  "atmosphere": "Mood, tone, atmospheric effects"
}

Pure JSON only. No markdown. Rich, specific descriptions for this ${nodeType}.`;
}
