/**
 * Environment DNA Builder
 * 
 * Builds a formatted environment context string for character generation prompts.
 * This gives the LLM rich context about the location so characters feel like
 * genuine inhabitants of their environment.
 */

import type { NodeDNA } from '../../../hierarchyAnalysis/types';

/**
 * Input structure for building environment DNA
 */
export interface EnvironmentDNAInput {
  // Core identity
  name: string;
  description?: string;
  spaceType?: 'interior' | 'exterior';
  
  // Visual DNA (from node.dna)
  looks?: string;
  materials?: string;
  colorsAndLighting?: string;
  atmosphere?: string;
  mood?: string;
  
  // Inherited style (cascaded from parent)
  genre?: string;
  architectural_tone?: string;
  cultural_tone?: string;
  materials_base?: string;
  mood_baseline?: string;
  palette_bias?: string;
  
  // Structural context
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
}

/**
 * Build environment DNA from node data and merged DNA
 * 
 * @param node - The current node (location/niche)
 * @param mergedDNA - Optional merged DNA with inherited values
 * @returns Formatted environment DNA string for LLM prompts
 */
export function buildEnvironmentDNA(
  node: {
    name: string;
    description?: string;
    spaceType?: 'interior' | 'exterior';
    dna?: Partial<NodeDNA>;
    dominantElements?: string[];
    uniqueIdentifiers?: string[];
  },
  mergedDNA?: Partial<NodeDNA>
): string {
  // Use merged DNA if provided, otherwise use node's own DNA
  const dna = mergedDNA || node.dna || {};
  
  const sections: string[] = [];
  
  // === HEADER ===
  sections.push(`ENVIRONMENT: ${node.name}`);
  if (node.spaceType) {
    sections.push(`TYPE: ${node.spaceType}`);
  }
  if (dna.genre) {
    sections.push(`GENRE: ${dna.genre}`);
  }
  
  // === DESCRIPTION ===
  if (node.description) {
    sections.push('');
    sections.push('DESCRIPTION:');
    sections.push(node.description);
  }
  
  // === VISUAL DESCRIPTION ===
  if (dna.looks) {
    sections.push('');
    sections.push('VISUAL DESCRIPTION:');
    sections.push(dna.looks);
  }
  
  // === MATERIALS ===
  if (dna.materials) {
    sections.push('');
    sections.push('MATERIALS:');
    sections.push(dna.materials);
  }
  
  // === COLORS & LIGHTING ===
  if (dna.colorsAndLighting) {
    sections.push('');
    sections.push('COLORS & LIGHTING:');
    sections.push(dna.colorsAndLighting);
  }
  
  // === ATMOSPHERE ===
  if (dna.atmosphere) {
    sections.push('');
    sections.push('ATMOSPHERE:');
    sections.push(dna.atmosphere);
  }
  
  // === MOOD ===
  if (dna.mood) {
    sections.push('');
    sections.push('MOOD:');
    sections.push(dna.mood);
  }
  
  // === STYLE CONTEXT ===
  const styleItems: string[] = [];
  if (dna.architectural_tone) {
    styleItems.push(`- Architectural: ${dna.architectural_tone}`);
  }
  if (dna.cultural_tone) {
    styleItems.push(`- Cultural: ${dna.cultural_tone}`);
  }
  if (dna.materials_base) {
    styleItems.push(`- Materials: ${dna.materials_base}`);
  }
  if (dna.mood_baseline) {
    styleItems.push(`- Baseline Mood: ${dna.mood_baseline}`);
  }
  if (dna.palette_bias) {
    styleItems.push(`- Color Palette: ${dna.palette_bias}`);
  }
  
  if (styleItems.length > 0) {
    sections.push('');
    sections.push('STYLE CONTEXT:');
    sections.push(styleItems.join('\n'));
  }
  
  // === KEY ELEMENTS ===
  const elements = node.dominantElements || [];
  const identifiers = node.uniqueIdentifiers || [];
  const allElements = [...elements, ...identifiers];
  
  if (allElements.length > 0) {
    sections.push('');
    sections.push('KEY ELEMENTS:');
    sections.push(allElements.map(e => `- ${e}`).join('\n'));
  }
  
  return sections.join('\n');
}

/**
 * Build a compact environment DNA string for shorter prompts
 * Only includes the most essential information
 * 
 * @param node - The current node
 * @param mergedDNA - Optional merged DNA
 * @returns Compact environment DNA string
 */
export function buildCompactEnvironmentDNA(
  node: {
    name: string;
    description?: string;
    spaceType?: 'interior' | 'exterior';
    dna?: Partial<NodeDNA>;
  },
  mergedDNA?: Partial<NodeDNA>
): string {
  const dna = mergedDNA || node.dna || {};
  
  const parts: string[] = [];
  
  // Core identity
  parts.push(`Location: ${node.name}`);
  if (node.spaceType) parts.push(`(${node.spaceType})`);
  if (dna.genre) parts.push(`Genre: ${dna.genre}`);
  
  // Key visual info
  if (dna.looks) {
    parts.push(`Visuals: ${dna.looks}`);
  }
  
  // Materials
  if (dna.materials) {
    parts.push(`Materials: ${dna.materials}`);
  }
  
  // Mood
  if (dna.mood) {
    parts.push(`Mood: ${dna.mood}`);
  }
  
  return parts.join('\n');
}

/**
 * Extract environment DNA input from a raw node object
 * Useful when working with backend node data
 */
export function extractEnvironmentDNAInput(
  node: Record<string, any>
): EnvironmentDNAInput {
  const dna = node.dna || {};
  
  return {
    // Core identity
    name: node.name || 'Unknown Location',
    description: node.description,
    spaceType: node.spaceType,
    
    // Visual DNA
    looks: dna.looks,
    materials: dna.materials,
    colorsAndLighting: dna.colorsAndLighting,
    atmosphere: dna.atmosphere,
    mood: dna.mood,
    
    // Inherited style
    genre: dna.genre,
    architectural_tone: dna.architectural_tone,
    cultural_tone: dna.cultural_tone,
    materials_base: dna.materials_base,
    mood_baseline: dna.mood_baseline,
    palette_bias: dna.palette_bias,
    
    // Structural context
    dominantElements: node.dominantElements || node.structure?.dominantElements,
    uniqueIdentifiers: node.uniqueIdentifiers || node.structure?.uniqueIdentifiers,
  };
}
