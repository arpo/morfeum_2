/**
 * Image Prompts Index
 * 
 * Context-aware image prompts for each node type.
 * Each node type has different camera style and composition.
 */

import type { NodeType, Node, ScenePerspective } from '../../types';
import type { NodeDNA } from '../../../hierarchyAnalysis/types';

/**
 * Camera configuration per node type
 */
const CAMERA_CONFIGS: Record<NodeType, {
  style: string;
  composition: string;
  angle: string;
}> = {
  host: {
    style: 'Cinematic establishing shot',
    composition: 'Ultra-wide, epic scale, panoramic view',
    angle: 'High aerial angle or dramatic low angle looking up',
  },
  region: {
    style: 'Aerial establishing shot',
    composition: 'Wide panoramic view of the entire district/biome. Multi-structure composition, no single hero building',
    angle: 'High-angle drone shot or bird\'s-eye view showing vast scale',
  },
  location: {
    style: 'Architectural photography',
    composition: 'Building exterior in focus, surrounding context visible',
    angle: 'Ground level, straight-on or slight angle to show depth',
  },
  niche: {
    style: 'Interior/detail photography',
    composition: 'Room composition showing space character',
    angle: 'Eye-level or slightly elevated, inviting perspective',
  },
};

/**
 * Generate image prompt for a host node
 */
export function hostImagePrompt(node: Node): string {
  const dna = node.dna || {};
  const camera = CAMERA_CONFIGS.host;

  return `${node.name}. ${node.description}

${camera.style}. ${camera.composition}. ${camera.angle}.

Visual Character:
${dna.looks || ''}

Atmosphere:
${dna.atmosphere || ''}

Colors and Lighting:
Dominant: ${dna.dominant || 'natural'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}
Light: ${dna.ambient || 'natural'}, ${dna.colorsAndLighting || ''}

Genre/Style: ${dna.genre || 'realistic'}
Architectural Style: ${dna.architectural_tone || ''}

Professional photography, highly detailed, cinematic composition, sharp focus on key landmarks, atmospheric depth.`;
}

/**
 * Generate image prompt for a region node
 */
export function regionImagePrompt(node: Node): string {
  const dna = node.dna || {};
  const camera = CAMERA_CONFIGS.region;

  return `${node.name} district/region. ${node.description}

${camera.style}. ${camera.composition}. ${camera.angle}.

Visual Character:
${dna.looks || ''}

Atmosphere:
${dna.atmosphere || ''}

Colors:
Dominant: ${dna.dominant || 'natural'}, Secondary: ${dna.secondary || ''}
Light: ${dna.ambient || 'natural'}

Architectural Style: ${dna.architectural_tone || ''}
Materials: ${dna.materials || ''}

Professional photography, detailed urban/landscape scene, atmospheric perspective, sense of scale.`;
}

/**
 * Generate image prompt for a location node
 */
export function locationImagePrompt(node: Node): string {
  const dna = node.dna || {};
  const camera = CAMERA_CONFIGS.location;
  const structure = (dna.structure || {}) as any;

  const structureDesc = [
    structure.form ? `Form: ${structure.form}` : '',
    structure.roofType ? `Roof: ${structure.roofType}` : '',
    structure.scale ? `Scale: ${structure.scale}` : '',
    structure.orientation ? `Orientation: ${structure.orientation}` : '',
    structure.openings ? `Openings: ${structure.openings}` : ''
  ].filter(Boolean).join(', ');

  return `${node.name}. ${node.description}

${camera.style}. ${camera.composition}. ${camera.angle}.

Building/Site Exterior:
${dna.looks || ''}
${structureDesc ? `Structure Details: ${structureDesc}` : ''}

Materials and Surfaces:
Primary: ${dna.primary_surfaces || ''}
Secondary: ${dna.secondary_surfaces || ''}
Accents: ${dna.accent_features || ''}

Colors:
Dominant: ${dna.dominant || 'natural'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}
Light: ${dna.ambient || 'natural'}

Atmosphere: ${dna.atmosphere || ''}
Mood: ${dna.mood || ''}

Architectural photography, building exterior in context, inviting entrance visible, warm ambient lighting from windows, detailed facade.`;
}

/**
 * Generate image prompt for a niche node (interior)
 */
export function nicheInteriorImagePrompt(node: Node): string {
  const dna = node.dna || {};

  return `${node.name}. ${node.description}

Interior photography. Room composition showing character and atmosphere. Eye-level perspective, inviting and immersive.

Space Layout:
${dna.spatialLayout || ''}

Visual Details:
${dna.looks || ''}

Materials:
Floor/Walls: ${dna.primary_surfaces || ''}
Furniture/Fixtures: ${dna.secondary_surfaces || ''}
Decorative Elements: ${dna.accent_features || ''}

Colors and Light:
Dominant: ${dna.dominant || 'warm'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}
Lighting: ${dna.colorsAndLighting || dna.ambient || 'warm ambient'}

Atmosphere: ${dna.atmosphere || ''}
Mood: ${dna.mood || ''}

Interior design photography, detailed textures, atmospheric lighting, sense of depth and space, lived-in quality.`;
}

/**
 * Generate image prompt for a niche node (exterior)
 */
export function nicheExteriorImagePrompt(node: Node): string {
  const dna = node.dna || {};

  return `${node.name}. ${node.description}

Exterior detail shot. Close composition of outdoor space. Eye-level, showing context and view beyond.

Space Layout:
${dna.spatialLayout || ''}

Visual Details:
${dna.looks || ''}

Materials:
Surfaces: ${dna.primary_surfaces || ''}
Features: ${dna.secondary_surfaces || ''}
Details: ${dna.accent_features || ''}

Colors and Light:
Dominant: ${dna.dominant || 'natural'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}
Lighting: ${dna.colorsAndLighting || dna.ambient || 'natural daylight'}

Atmosphere: ${dna.atmosphere || ''}
View Beyond: ${node.navigableElements?.map(e => e.description).join(', ') || 'surrounding area visible'}

Architectural photography, outdoor space detail, sense of openness, atmospheric conditions visible, connection to larger environment.`;
}

/**
 * Get the appropriate image prompt for a node
 * 
 * @param node - Node to generate image prompt for
 * @param perspective - For niche nodes, interior or exterior
 * @returns Image prompt string
 */
export function getNodeImagePrompt(
  node: Node,
  perspective: ScenePerspective = 'exterior'
): string {
  switch (node.type) {
    case 'host':
      return hostImagePrompt(node);
    case 'region':
      return regionImagePrompt(node);
    case 'location':
      return locationImagePrompt(node);
    case 'niche':
      return perspective === 'interior' 
        ? nicheInteriorImagePrompt(node)
        : nicheExteriorImagePrompt(node);
    default:
      return locationImagePrompt(node);
  }
}
