/**
 * Destination Analysis Prompt - Optimized
 * LLM prompt for analyzing GOTO command destinations
 */

import type { NavigationContext, ScenePerspective } from '../../../navigation/types';
import { mergeDNA } from '../../../hierarchyAnalysis/dnaMerge';

/**
 * Static content for caching (~600 tokens)
 * Contains task definition, rules, and output template
 */
export const DESTINATION_ANALYSIS_STATIC = `Analyze destination within location.

TASK: Determine:
1. Name: Concise space name ("The Kitchen", "Wine Cellar")
2. Perspective: INTERIOR (enclosed, roof) | EXTERIOR (open outdoor) | OPEN-AIR (semi-enclosed, open sky)
3. SpaceType: room|outdoor|hallway|cellar|attic|balcony|garden|courtyard
4. IsEnclosed: true (walls+ceiling) | false
5. AtmosphereHint: Brief atmosphere blending request with parent style
6. SynthesizedDescription: Rich description combining user request + inherited DNA

RULES:
- New space must BELONG to parent (same style, era, materials)
- Honor user's specific requests, blend with inherited DNA
- Kitchen in Victorian mansion = Victorian; in medieval castle = medieval

OUTPUT (pure JSON):
{
  "name": "space name",
  "perspective": "interior|exterior|open-air",
  "spaceType": "type",
  "isEnclosed": boolean,
  "atmosphereHint": "brief description",
  "synthesizedDescription": "rich description"
}`;

interface DestinationAnalysisInput {
  userPrompt: string;
  context: NavigationContext;
}

/**
 * Generate prompt for LLM to analyze destination and synthesize with context
 */
export function destinationAnalysisPrompt(input: DestinationAnalysisInput): string {
  const { userPrompt, context } = input;
  
  const mergedDNA = (context.parentNode?.dna && context.currentNode.dna)
    ? mergeDNA(context.parentNode.dna as any, context.currentNode.dna as any)
    : (context.currentNode.dna || {}) as any;

  // Build DNA context - only non-empty fields
  const dnaLines: string[] = [];
  if (mergedDNA.genre) dnaLines.push(`Genre: ${mergedDNA.genre}`);
  if (mergedDNA.architectural_tone) dnaLines.push(`Style: ${mergedDNA.architectural_tone}`);
  if (mergedDNA.cultural_tone) dnaLines.push(`Cultural: ${mergedDNA.cultural_tone}`);
  if (mergedDNA.mood) dnaLines.push(`Mood: ${mergedDNA.mood}`);
  if (mergedDNA.materials) dnaLines.push(`Materials: ${mergedDNA.materials}`);
  if (mergedDNA.palette_bias) dnaLines.push(`Palette: ${mergedDNA.palette_bias}`);
  if (mergedDNA.atmosphere) dnaLines.push(`Atmosphere: ${mergedDNA.atmosphere}`);

  return `Analyze destination within location.

CURRENT: "${context.currentNode.name}" (${context.currentNode.type})
${context.currentNode.data?.description ? `Desc: ${context.currentNode.data.description}` : ''}
PARENT: "${context.parentNode?.name || 'Unknown'}" (${context.parentNode?.type || 'unknown'})

INHERITED STYLE:
${dnaLines.join('\n')}

DESTINATION: "${userPrompt}"

TASK: Determine:
1. Name: Concise space name ("The Kitchen", "Wine Cellar")
2. Perspective: INTERIOR (enclosed, roof) | EXTERIOR (open outdoor) | OPEN-AIR (semi-enclosed, open sky)
3. SpaceType: room|outdoor|hallway|cellar|attic|balcony|garden|courtyard
4. IsEnclosed: true (walls+ceiling) | false
5. AtmosphereHint: Brief atmosphere blending request with parent style
6. SynthesizedDescription: Rich description combining user request + inherited DNA

RULES:
- New space must BELONG to parent (same style, era, materials)
- Honor user's specific requests, blend with inherited DNA
- Kitchen in Victorian mansion = Victorian; in medieval castle = medieval

OUTPUT (pure JSON):
{
  "name": "space name",
  "perspective": "interior|exterior|open-air",
  "spaceType": "type",
  "isEnclosed": boolean,
  "atmosphereHint": "brief description",
  "synthesizedDescription": "rich description"
}`;
}
