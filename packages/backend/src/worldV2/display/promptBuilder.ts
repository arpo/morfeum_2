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

/**
 * Structured prompt layers for image composition
 */
export interface PromptLayers {
  name: string;         // Node name
  description: string;  // Node description
  background: string;   // Far elements from LAYERS section
  midground: string;    // Middle elements from LAYERS section
  foreground: string;   // Close elements from LAYERS section
  lighting: string;     // From DNA colorAndLight
  atmosphere: string;   // From DNA atmosphere
}

/**
 * Result from prompt builder with both string and structured data
 */
export interface PromptResult {
  prompt: string;       // Final concatenated prompt for image generation
  layers: PromptLayers; // Structured layers for storage/editing
}

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
): PromptResult {
  const cameraConfig = getV2CameraConfig('host');
  const dna = cascadeDNA({ host: host.dna });

  // Build structured layers matching composition instructions
  // HOST LAYERS: Far → horizon, sky dome, haze | Mid → landmarks, terrain | Close → terrain texture, roads
  const layers: PromptLayers = {
    name: host.name,
    description: host.description || 'World overview.',
    background: 'Horizon, sky dome, atmospheric haze',
    midground: 'Landmarks, terrain, district boundaries, waterways',
    foreground: 'Terrain texture, road networks, building clusters (still distant)',
    lighting: dna.colorAndLight.join(', ') || 'Natural environmental lighting',
    atmosphere: dna.atmosphere.join(', ') || 'Epic scale, world-building tone'
  };

  const basePrompt = `${host.name}. ${host.description || 'World overview.'}

${formatDNAPrompt(dna)}

${cameraConfig.composition}

${formatCameraPrompt(cameraConfig)}

${formatBannedPrompt(dna.banned)}`;

  const prompt = applyMorfeumStyle(basePrompt.trim(), {
    creatureMode: options.creatureMode ?? 'none'
  });

  return { prompt, layers };
}

/**
 * Build image prompt for a Region node
 */
export function buildRegionImagePrompt(
  host: Host,
  region: Region,
  options: BuildPromptOptions = {}
): PromptResult {
  const cameraConfig = getV2CameraConfig('region');
  const dna = cascadeDNA({ host: host.dna, region: region.dna });

  // Build structured layers matching composition instructions
  // REGION LAYERS: Foreground → nearby rooftops | Midground → streets, buildings | Background → distant skyline
  const layers: PromptLayers = {
    name: region.name,
    description: region.description || 'District overview.',
    background: `Neighboring districts, distant skyline of ${host.name}`,
    midground: 'Streets, buildings, local landmarks',
    foreground: 'Nearby rooftops, architectural details',
    lighting: dna.colorAndLight.join(', ') || 'District ambient lighting',
    atmosphere: dna.atmosphere.join(', ') || 'Neighborhood character and mood'
  };

  const basePrompt = `${region.name} district of ${host.name}. ${region.description || 'Region overview.'}

${formatDNAPrompt(dna)}

${cameraConfig.composition}

${formatCameraPrompt(cameraConfig)}

${formatBannedPrompt(dna.banned)}`;

  const prompt = applyMorfeumStyle(basePrompt.trim(), {
    creatureMode: options.creatureMode ?? 'none'
  });

  return { prompt, layers };
}

/**
 * Build image prompt for a WorldNode (location)
 */
export function buildLocationImagePrompt(
  host: Host,
  region: Region,
  location: WorldNode,
  options: BuildPromptOptions = {}
): PromptResult {
  const spaceType = location.spaceType || 'exterior';
  const cameraConfig = getV2CameraConfig('location', spaceType);
  const dna = cascadeDNA({ 
    host: host.dna, 
    region: region.dna, 
    location: location.dna 
  });

  const spaceLabel = spaceType === 'interior' ? 'Interior of' : 'Exterior view of';
  
  // Build structured layers matching composition instructions
  // EXTERIOR LAYERS: Foreground → street surface, curb | Midground → building facade | Background → sky, neighbors
  // INTERIOR LAYERS: Back → walls, windows | Mid → room features | Close → table surfaces, objects
  const layers: PromptLayers = spaceType === 'interior' 
    ? {
        name: location.name,
        description: location.description || '',
        background: 'Back walls, windows, distant interior features',
        midground: 'Main room features, furniture, focal points',
        foreground: 'Table surfaces, objects, textures near viewer',
        lighting: dna.colorAndLight.join(', ') || 'Interior lighting and ambiance',
        atmosphere: dna.atmosphere.join(', ') || 'Interior mood and character'
      }
    : {
        name: location.name,
        description: location.description || '',
        background: 'Sky, neighboring buildings',
        midground: 'Building facade (main subject, off-center)',
        foreground: 'Street surface, curb, 1 environmental element',
        lighting: dna.colorAndLight.join(', ') || 'Street-level natural lighting',
        atmosphere: dna.atmosphere.join(', ') || 'Location character and street mood'
      };

  const basePrompt = `${spaceLabel} ${location.name} in ${region.name}, ${host.name}. ${location.description || ''}

${formatDNAPrompt(dna)}

${cameraConfig.composition}

${formatCameraPrompt(cameraConfig)}

${formatBannedPrompt(dna.banned)}`;

  const prompt = applyMorfeumStyle(basePrompt.trim(), {
    creatureMode: options.creatureMode ?? 'none'
  });

  return { prompt, layers };
}

// Export for use in displayHandler
export { cascadeDNA, CascadedDNAChain };
