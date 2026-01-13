/**
 * Style Lock Compiler
 * 
 * Compiles effective DNA into a style lock prompt section for image editing.
 * Used by navigation commands (GO_INSIDE2, REFRAME2, etc.) to maintain visual consistency.
 * 
 * Based on the Navigation spec: DNA fields are compiled into non-negotiable style constraints
 * that prevent the image edit model from drifting away from the established visual identity.
 */

import type { DNA } from '../types';

/**
 * Fields required for a complete style lock
 */
export interface StyleLockFields {
  /** Core visual identity */
  essence: string[];
  /** Dominant forms and materials */
  formsAndMaterials: string[];
  /** Color palette and lighting */
  colorAndLight: string[];
  /** Emotional tone and atmosphere */
  atmosphere: string[];
  /** Visual motifs to avoid (genre drift prevention) */
  banned: string[];
}

/**
 * Compiled style lock ready for prompt assembly
 */
export interface CompiledStyleLock {
  /** The full style lock text block */
  styleLockText: string;
  /** Prohibited transformations text block */
  prohibitionsText: string;
  /** Whether the style lock is complete (all required fields present) */
  isComplete: boolean;
}

/**
 * Compile DNA into style lock text for image editing prompts
 * 
 * @param effectiveDNA - The cascaded/merged DNA from the node hierarchy
 * @param additionalProhibitions - Extra prohibitions specific to the command
 * @returns Compiled style lock ready for prompt assembly
 */
export function compileStyleLock(
  effectiveDNA: DNA,
  additionalProhibitions: string[] = []
): CompiledStyleLock {
  // Check completeness
  const isComplete = 
    effectiveDNA.essence.length > 0 &&
    effectiveDNA.formsAndMaterials.length > 0 &&
    effectiveDNA.colorAndLight.length > 0 &&
    effectiveDNA.atmosphere.length > 0;

  // Build style lock sections
  const sections: string[] = [];

  // Essence - core visual identity
  if (effectiveDNA.essence.length > 0) {
    sections.push(`VISUAL IDENTITY:\n${effectiveDNA.essence.map(e => `* ${e}`).join('\n')}`);
  }

  // Forms and Materials
  if (effectiveDNA.formsAndMaterials.length > 0) {
    sections.push(`MATERIALS & FORMS:\n${effectiveDNA.formsAndMaterials.map(f => `* ${f}`).join('\n')}`);
  }

  // Color and Light
  if (effectiveDNA.colorAndLight.length > 0) {
    sections.push(`COLOR & LIGHTING:\n${effectiveDNA.colorAndLight.map(c => `* ${c}`).join('\n')}`);
  }

  // Atmosphere
  if (effectiveDNA.atmosphere.length > 0) {
    sections.push(`ATMOSPHERE:\n${effectiveDNA.atmosphere.map(a => `* ${a}`).join('\n')}`);
  }

  const styleLockText = sections.join('\n\n');

  // Build prohibitions from banned list + additional
  const allProhibitions = [...effectiveDNA.banned, ...additionalProhibitions];
  const prohibitionsText = allProhibitions.length > 0
    ? allProhibitions.map(p => `* Do not ${p.toLowerCase()}`).join('\n')
    : '* Maintain strict visual continuity';

  return {
    styleLockText,
    prohibitionsText,
    isComplete
  };
}

/**
 * Get default prohibited transformations for /enter (GO_INSIDE2) commands
 * These prevent common issues when transitioning between spaces
 */
export function getEnterProhibitions(): string[] {
  return [
    'remain outside/at the doorway if the target is an interior',
    'keep the previous location framing as dominant',
    'change the established material palette',
    'alter the lighting style or mood',
    'introduce new architectural elements not consistent with the space',
    'add modern elements to historical spaces or vice versa'
  ];
}

/**
 * Get default prohibited transformations for /reframe commands
 */
export function getReframeProhibitions(): string[] {
  return [
    'change location/node',
    'introduce new objects',
    'redesign materials, lighting, or mood',
    'alter the space type (interior/exterior)'
  ];
}

/**
 * Get default prohibited transformations for /inspect commands
 */
export function getInspectProhibitions(): string[] {
  return [
    'change location/node',
    'introduce new objects',
    'alter global lighting or palette',
    'change the detail being inspected'
  ];
}

/**
 * Get default prohibited transformations for /jump (GOTO2) commands
 */
export function getJumpProhibitions(): string[] {
  return [
    'blend elements from the previous location',
    'maintain previous location\'s style if different',
    'create transitional or hybrid spaces'
  ];
}
