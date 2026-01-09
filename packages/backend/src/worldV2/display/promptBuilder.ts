/**
 * V2 Prompt Builder
 * 
 * Builds image prompts from V2 DNA structure.
 * Uses cascaded DNA from host→region→location.
 */

import { Host, Region, WorldNode, DNA } from '../types';
import { getV2CameraConfig, formatCameraPrompt, V2NodeType } from './cameraSettings';
import { applyMorfeumStyle } from '../../engine/generation/shared/applyMorfeumStyle';
import type { CreatureMode } from '../../engine/generation/shared/imagePromptTypes';

interface CascadedDNAChain {
  host?: DNA;
  region?: DNA;
  location?: DNA;
}

/**
 * Merge DNA arrays, combining parent and child values
 * Child values come after parent values for emphasis
 */
function mergeDNAArrays(parent: string[] = [], child: string[] = []): string[] {
  // If child is empty, inherit parent
  if (child.length === 0) return parent;
  // Combine both, child additions come after
  return [...parent, ...child];
}

/**
 * Cascade DNA from host→region→location
 */
function cascadeDNA(dnaChain: CascadedDNAChain): DNA {
  const base: DNA = {
    essence: [],
    formsAndMaterials: [],
    colorAndLight: [],
    atmosphere: [],
    banned: []
  };

  // Merge host DNA
  if (dnaChain.host) {
    base.essence = mergeDNAArrays(base.essence, dnaChain.host.essence);
    base.formsAndMaterials = mergeDNAArrays(base.formsAndMaterials, dnaChain.host.formsAndMaterials);
    base.colorAndLight = mergeDNAArrays(base.colorAndLight, dnaChain.host.colorAndLight);
    base.atmosphere = mergeDNAArrays(base.atmosphere, dnaChain.host.atmosphere);
    base.banned = mergeDNAArrays(base.banned, dnaChain.host.banned);
  }

  // Merge region DNA (delta on top of host)
  if (dnaChain.region) {
    base.essence = mergeDNAArrays(base.essence, dnaChain.region.essence);
    base.formsAndMaterials = mergeDNAArrays(base.formsAndMaterials, dnaChain.region.formsAndMaterials);
    base.colorAndLight = mergeDNAArrays(base.colorAndLight, dnaChain.region.colorAndLight);
    base.atmosphere = mergeDNAArrays(base.atmosphere, dnaChain.region.atmosphere);
    base.banned = mergeDNAArrays(base.banned, dnaChain.region.banned);
  }

  // Merge location DNA (delta on top of region)
  if (dnaChain.location) {
    base.essence = mergeDNAArrays(base.essence, dnaChain.location.essence);
    base.formsAndMaterials = mergeDNAArrays(base.formsAndMaterials, dnaChain.location.formsAndMaterials);
    base.colorAndLight = mergeDNAArrays(base.colorAndLight, dnaChain.location.colorAndLight);
    base.atmosphere = mergeDNAArrays(base.atmosphere, dnaChain.location.atmosphere);
    base.banned = mergeDNAArrays(base.banned, dnaChain.location.banned);
  }

  return base;
}

/**
 * Format DNA as prompt sections
 */
function formatDNAPrompt(dna: DNA): string {
  const sections: string[] = [];

  if (dna.essence.length > 0) {
    sections.push(`Visual Identity: ${dna.essence.join(', ')}`);
  }

  if (dna.formsAndMaterials.length > 0) {
    sections.push(`Forms & Materials: ${dna.formsAndMaterials.join(', ')}`);
  }

  if (dna.colorAndLight.length > 0) {
    sections.push(`Colors & Lighting: ${dna.colorAndLight.join(', ')}`);
  }

  if (dna.atmosphere.length > 0) {
    sections.push(`Atmosphere: ${dna.atmosphere.join(', ')}`);
  }

  return sections.join('\n');
}

/**
 * Format banned items as negative constraints
 */
function formatBannedPrompt(banned: string[]): string {
  if (banned.length === 0) return '';
  return `[NEG:] ${banned.join(', ')}`;
}

export interface BuildPromptOptions {
  creatureMode?: CreatureMode;
}

/**
 * Build image prompt for a Host node
 */
export function buildHostImagePrompt(
  host: Host,
  options: BuildPromptOptions = {}
): string {
  const cameraConfig = getV2CameraConfig('host');
  const dna = cascadeDNA({ host: host.dna });

  const basePrompt = `${host.name}. ${host.description || 'World overview.'}

${formatDNAPrompt(dna)}

${cameraConfig.composition}

${formatCameraPrompt(cameraConfig)}

${formatBannedPrompt(dna.banned)}`;

  return applyMorfeumStyle(basePrompt.trim(), {
    creatureMode: options.creatureMode ?? 'none'
  });
}

/**
 * Build image prompt for a Region node
 */
export function buildRegionImagePrompt(
  host: Host,
  region: Region,
  options: BuildPromptOptions = {}
): string {
  const cameraConfig = getV2CameraConfig('region');
  const dna = cascadeDNA({ host: host.dna, region: region.dna });

  const basePrompt = `${region.name} district of ${host.name}. ${region.description || 'Region overview.'}

${formatDNAPrompt(dna)}

${cameraConfig.composition}

${formatCameraPrompt(cameraConfig)}

${formatBannedPrompt(dna.banned)}`;

  return applyMorfeumStyle(basePrompt.trim(), {
    creatureMode: options.creatureMode ?? 'none'
  });
}

/**
 * Build image prompt for a WorldNode (location)
 */
export function buildLocationImagePrompt(
  host: Host,
  region: Region,
  location: WorldNode,
  options: BuildPromptOptions = {}
): string {
  const spaceType = location.spaceType || 'exterior';
  const cameraConfig = getV2CameraConfig('location', spaceType);
  const dna = cascadeDNA({ 
    host: host.dna, 
    region: region.dna, 
    location: location.dna 
  });

  const spaceLabel = spaceType === 'interior' ? 'Interior of' : 'Exterior view of';
  
  const basePrompt = `${spaceLabel} ${location.name} in ${region.name}, ${host.name}. ${location.description || ''}

${formatDNAPrompt(dna)}

${cameraConfig.composition}

${formatCameraPrompt(cameraConfig)}

${formatBannedPrompt(dna.banned)}`;

  return applyMorfeumStyle(basePrompt.trim(), {
    creatureMode: options.creatureMode ?? 'none'
  });
}

// Export for use in displayHandler
export { cascadeDNA, CascadedDNAChain };
