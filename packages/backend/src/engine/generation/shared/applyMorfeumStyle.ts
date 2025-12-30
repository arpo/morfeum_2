/**
 * Apply Morfeum Style to Image Prompts
 * 
 * Wraps any image prompt with Morfeum's signature visual style:
 * - morfeumVibes: Living-surface sheen, sharp highlights, etc.
 * - Creature mode control (none/allow/populate)
 * - qualityPrompt: Crisp micro-detail, refined surfaces, etc.
 * 
 * Usage:
 * - Locations: applyMorfeumStyle(prompt) // creatureMode defaults to 'none'
 * - Characters: applyMorfeumStyle(prompt, { creatureMode: 'allow' })
 * - Crowds: applyMorfeumStyle(prompt, { creatureMode: 'populate' })
 */

import { morfeumVibes, NoCreatures, PopulateScene, qualityPrompt } from '../prompts/shared/constants';
import type { CreatureMode } from './imagePromptTypes';

export interface MorfeumStyleOptions {
  /**
   * Creature mode for scene population
   * - 'none' (default): NoCreatures filter applied
   * - 'allow': No filter, people can appear naturally
   * - 'populate': Active crowd directive added
   */
  creatureMode?: CreatureMode;
}

/**
 * Apply Morfeum's signature visual style to any image prompt
 * 
 * @param prompt - The base image prompt (location, character, etc.)
 * @param options - Style options
 * @returns Wrapped prompt with Morfeum style applied
 */
export function applyMorfeumStyle(
  prompt: string,
  options: MorfeumStyleOptions = {}
): string {
  const { creatureMode = 'none' } = options;

  const parts = [
    morfeumVibes,
    '',  // Empty line for readability
    prompt,
    ''   // Empty line for readability
  ];

  // Creature mode handling
  if (creatureMode === 'none') {
    parts.push(NoCreatures);
    parts.push('');
  } else if (creatureMode === 'populate') {
    parts.push(PopulateScene);
    parts.push('');
  }
  // creatureMode === 'allow' - no filter added

  parts.push(qualityPrompt);

  return parts.join('\n');
}

// Re-export for convenience
export { morfeumVibes, NoCreatures, PopulateScene, qualityPrompt };
