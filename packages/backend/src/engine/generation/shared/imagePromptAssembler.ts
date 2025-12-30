/**
 * Image Prompt Assembler
 * 
 * Assembles ImagePromptStructure into final FLUX prompt string.
 * Handles:
 * - Layer composition (background → midground → foreground)
 * - Creature mode control (none/allow/populate)
 * - Morfeum style wrappers
 * - Camera/lens configuration
 */

import type { ImagePromptStructure, AssemblePromptOptions, CreatureMode } from './imagePromptTypes';
import { morfeumVibes, NoCreatures, PopulateScene, qualityPrompt } from '../prompts/shared/constants';

/**
 * Assemble structured image prompt into final FLUX prompt string
 * 
 * @param structure - Structured image prompt with layers
 * @param options - Assembly options (NoCreatures toggle, style, camera)
 * @returns Final prompt string ready for FLUX
 */
export function assembleImagePrompt(
  structure: ImagePromptStructure,
  options: AssemblePromptOptions = {}
): string {
  const {
    creatureMode = 'none',
    includeMorfeumStyle = true,
    cameraConfig
  } = options;

  const parts: string[] = [];

  // Morfeum style prefix
  if (includeMorfeumStyle) {
    parts.push(morfeumVibes);
    parts.push('');
  }

  // Scene layers with headers and blank lines
  if (structure.background) {
    parts.push(`Background: ${structure.background}`);
    parts.push('');
  }

  if (structure.midground) {
    parts.push(`Midground: ${structure.midground}`);
    parts.push('');
  }

  if (structure.foreground) {
    parts.push(`Foreground: ${structure.foreground}`);
    parts.push('');
  }

  // Lighting
  if (structure.lighting) {
    parts.push(`Lighting: ${structure.lighting}`);
    parts.push('');
  }

  // Atmosphere
  if (structure.atmosphere) {
    parts.push(`Atmosphere: ${structure.atmosphere}`);
    parts.push('');
  }

  // Constraints (CRITICAL directives for FLUX)
  if (structure.constraints && structure.constraints.length > 0) {
    for (const constraint of structure.constraints) {
      parts.push(constraint);
    }
    parts.push('');
  }

  // Camera and lens
  if (structure.camera) {
    parts.push(`[CAMERA:] ${structure.camera}`);
  }
  if (structure.lens) {
    parts.push(`[LENS:] ${structure.lens}`);
  }
  if (structure.camera || structure.lens) {
    parts.push('');
  }

  // External camera config (from NICHE_CAMERA etc.)
  if (cameraConfig) {
    parts.push(cameraConfig);
    parts.push('');
  }

  // Creature mode handling
  if (creatureMode === 'none') {
    // NoCreatures filter - exclude all people/animals
    parts.push(NoCreatures);
    parts.push('');
  } else if (creatureMode === 'populate') {
    // Populate scene - add crowd directive
    parts.push(PopulateScene);
    parts.push('');
  }
  // creatureMode === 'allow' - no filter added, people can appear naturally
  
  // Custom negatives (if any, regardless of creature mode)
  if (structure.negatives && structure.negatives.length > 0) {
    parts.push(`[NEG:] ${structure.negatives.join(', ')}`);
    parts.push('');
  }

  // Quality prompt suffix
  if (includeMorfeumStyle) {
    parts.push(qualityPrompt);
  }

  return parts.join('\n').trim();
}

/**
 * Parse an existing prompt string back into structured format
 * Useful for migrating existing prompts or editing stored prompts
 * 
 * Note: This is a best-effort parser and may not perfectly reconstruct
 * all fields if the original prompt didn't follow the structured format.
 */
export function parseImagePrompt(promptString: string): Partial<ImagePromptStructure> {
  const structure: Partial<ImagePromptStructure> = {
    constraints: [],
    negatives: []
  };

  const lines = promptString.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Parse labeled sections
    if (trimmed.startsWith('Background:')) {
      structure.background = trimmed.replace('Background:', '').trim();
    } else if (trimmed.startsWith('Midground:')) {
      structure.midground = trimmed.replace('Midground:', '').trim();
    } else if (trimmed.startsWith('Foreground:')) {
      structure.foreground = trimmed.replace('Foreground:', '').trim();
    } else if (trimmed.startsWith('Lighting:')) {
      structure.lighting = trimmed.replace('Lighting:', '').trim();
    } else if (trimmed.startsWith('Atmosphere:')) {
      structure.atmosphere = trimmed.replace('Atmosphere:', '').trim();
    } else if (trimmed.startsWith('[CAMERA:]')) {
      structure.camera = trimmed.replace('[CAMERA:]', '').trim();
    } else if (trimmed.startsWith('[LENS:]')) {
      structure.lens = trimmed.replace('[LENS:]', '').trim();
    } else if (trimmed.startsWith('[CRITICAL')) {
      structure.constraints!.push(trimmed);
    } else if (trimmed.startsWith('[NEG:]')) {
      const negs = trimmed.replace('[NEG:]', '').trim().split(',').map(n => n.trim());
      structure.negatives!.push(...negs);
    }
  }

  return structure;
}
