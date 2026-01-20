/**
 * Style Lock Compiler
 * 
 * Compiles DNA into style lock text for image prompts.
 * Simple: DNA in → style lock out. No additions, no assumptions.
 * 
 * NOTE: For navigation (GO_INSIDE), we now use promptLayers instead of DNA-based style locks.
 * See: imageEditPrompt.ts for the promptLayers-based approach.
 * The functions here are still used for initial image generation.
 */

import type { DNA } from '../types';

/**
 * Build style lock text from DNA
 * 
 * Generic function - only outputs what's in the DNA arrays.
 * Used by image generation and image editing prompts.
 */
export function buildStyleLock(dna: DNA): string {
  const sections: string[] = [];
  
  if (dna.essence.length > 0)
    sections.push(`Identity:\n${dna.essence.map(e => `* ${e}`).join('\n')}`);
  
  if (dna.formsAndMaterials.length > 0)
    sections.push(`Materials:\n${dna.formsAndMaterials.map(m => `* ${m}`).join('\n')}`);
  
  if (dna.colorAndLight.length > 0)
    sections.push(`Color & Light:\n${dna.colorAndLight.map(c => `* ${c}`).join('\n')}`);
  
  if (dna.atmosphere.length > 0)
    sections.push(`Atmosphere:\n${dna.atmosphere.map(a => `* ${a}`).join('\n')}`);
  
  if (dna.banned.length > 0)
    sections.push(`Banned:\n${dna.banned.map(b => `* ${b}`).join('\n')}`);
  
  return sections.join('\n\n');
}

/**
 * Compile DNA into style lock with prohibitions
 * 
 * Uses dna.banned array for prohibitions - no hardcoded defaults.
 */
export function compileStyleLock(dna: DNA): { styleLockText: string; prohibitionsText: string } {
  const styleLockText = buildStyleLock(dna);
  
  const prohibitionsText = dna.banned.length > 0
    ? dna.banned.map(p => `* Do not ${p.toLowerCase()}`).join('\n')
    : '';

  return { styleLockText, prohibitionsText };
}
