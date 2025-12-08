/**
 * Apply Morfeum Style to Image Prompts
 * 
 * Wraps any image prompt with Morfeum's signature visual style:
 * - morfeumVibes: Living-surface sheen, sharp highlights, etc.
 * - NoCreatures: Filter to exclude people/animals (optional)
 * - qualityPrompt: Crisp micro-detail, refined surfaces, etc.
 * 
 * Usage:
 * - Locations: applyMorfeumStyle(prompt) // excludeCreatures defaults to true
 * - Characters: applyMorfeumStyle(prompt, { excludeCreatures: false })
 */

import { morfeumVibes, NoCreatures, qualityPrompt } from '../prompts/shared/constants';

export interface MorfeumStyleOptions {
  /**
   * Whether to include the NoCreatures filter.
   * - true (default): Excludes humans, animals, creatures from the image
   * - false: Allows living subjects (use for character images)
   */
  excludeCreatures?: boolean;
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
  const { excludeCreatures = true } = options;

  const parts = [
    morfeumVibes,
    '',  // Empty line for readability
    prompt,
    ''   // Empty line for readability
  ];

  if (excludeCreatures) {
    parts.push(NoCreatures);
    parts.push('');
  }

  parts.push(qualityPrompt);

  return parts.join('\n');
}

// Re-export for convenience
export { morfeumVibes, NoCreatures, qualityPrompt };
