/**
 * World Tree Direct Prompt Builder
 * 
 * Generate DIRECT FLUX prompt from DNA (fallback/simple approach)
 * Used when LLM synthesis step is not available
 */

import { applyMorfeumStyle } from '../../../shared/applyMorfeumStyle';
import {
  OVERVIEW_SHOT, 
  LOCATION_SHOT, 
  NICHE_SHOT_INTERIOR, 
  ALIGNMENT 
} from '../../shared/cameraConfig';
import type { NodeDNA } from '../../../../hierarchyAnalysis/types';
import type { WorldTreeImagePromptParams } from './contextPromptBuilder';

/**
 * Get camera configuration based on node type
 */
function getCameraConfig(nodeType: 'host' | 'region' | 'location' | 'niche') {
  switch (nodeType) {
    case 'host':
      return OVERVIEW_SHOT;
    case 'region':
      return OVERVIEW_SHOT; // Regions also get elevated overview
    case 'location':
      return LOCATION_SHOT; // Exterior shot
    case 'niche':
      return NICHE_SHOT_INTERIOR; // Interior shot
  }
}

/**
 * Build context text from parent chain
 */
function buildContextText(parentChain: Array<{ type: string; name: string; description: string }>): string {
  if (parentChain.length === 0) return '';
  
  return parentChain
    .map(p => {
      const typeLabel = p.type.charAt(0).toUpperCase() + p.type.slice(1);
      return `${typeLabel} ${p.name}: ${p.description}.`;
    })
    .join('\n\n');
}

/**
 * Build scene description from DNA
 */
function buildSceneDescription(dna: Partial<NodeDNA>, nodeType: string): string {
  const parts: string[] = [];
  
  // Main visual description
  if (dna.looks) {
    parts.push(`Looks: ${dna.looks}`);
  }
  
  // Spatial layout
  if (dna.spatialLayout) {
    parts.push(`Layout: ${dna.spatialLayout}`);
  }
  
  // Colors and lighting
  if (dna.colorsAndLighting) {
    parts.push(`Lighting: ${dna.colorsAndLighting}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Build materials section from DNA
 */
function buildMaterialsSection(dna: Partial<NodeDNA>): string {
  const parts: string[] = [];
  
  if (dna.materials) {
    parts.push(`[MATERIALS:] ${dna.materials}`);
  }
  
  if (dna.primary_surfaces || dna.secondary_surfaces || dna.accent_features) {
    const surfaces: string[] = [];
    if (dna.primary_surfaces) surfaces.push(`Primary: ${dna.primary_surfaces}`);
    if (dna.secondary_surfaces) surfaces.push(`Secondary: ${dna.secondary_surfaces}`);
    if (dna.accent_features) surfaces.push(`Accents: ${dna.accent_features}`);
    parts.push(`[SURFACES:] ${surfaces.join(' | ')}`);
  }
  
  return parts.join('\n');
}

/**
 * Build atmosphere section from DNA
 */
function buildAtmosphereSection(dna: Partial<NodeDNA>): string {
  const parts: string[] = [];
  
  if (dna.atmosphere) {
    parts.push(`[ATMOSPHERE:] ${dna.atmosphere}`);
  }
  
  // Color palette
  const colorParts: string[] = [];
  if (dna.dominant) colorParts.push(`Dominant: ${dna.dominant}`);
  if (dna.secondary) colorParts.push(`Secondary: ${dna.secondary}`);
  if (dna.accent) colorParts.push(`Accent: ${dna.accent}`);
  if (dna.ambient) colorParts.push(`Ambient light: ${dna.ambient}`);
  
  if (colorParts.length > 0) {
    parts.push(`[COLOR PALETTE:] ${colorParts.join(' | ')}`);
  }
  
  // Sounds (for atmosphere hints even in images)
  if (dna.sounds) {
    parts.push(`[AMBIENT HINTS:] ${dna.sounds}`);
  }
  
  return parts.join('\n');
}

/**
 * Generate DIRECT FLUX prompt from DNA (fallback/simple approach)
 * Used when LLM synthesis step is not available
 */
export function worldTreeImagePrompt(params: WorldTreeImagePromptParams): string {
  const { nodeType, nodeName, dna, originalPrompt, parentChain } = params;
  
  // Get camera configuration based on node type
  const cameraConfig = getCameraConfig(nodeType);
  
  // Build context from parent chain
  const contextText = buildContextText(parentChain);
  
  // Build scene description from DNA
  const sceneDescription = buildSceneDescription(dna, nodeType);
  
  // Build materials and colors section from DNA
  const materialsSection = buildMaterialsSection(dna);
  
  // Build atmosphere section from DNA
  const atmosphereSection = buildAtmosphereSection(dna);
  
  const prompt = `Original user description: "${originalPrompt}"

${nodeName}, ${cameraConfig.shot}.

[CAMERA ALIGNMENT:] ${ALIGNMENT.CENTERED}
[LIGHT:] ${cameraConfig.light}
[LENS:] ${cameraConfig.lens}

[SCENE:]
${contextText}
${sceneDescription}

${materialsSection}

${atmosphereSection}

[ARCHITECTURAL STYLE:] ${dna.architectural_tone || 'Not specified'}
[MOOD:] ${dna.mood || dna.mood_baseline || 'Not specified'}`;

  return applyMorfeumStyle(prompt);
}
