/**
 * Image Prompts Index
 * 
 * Context-aware image prompts for each node type.
 * Uses Flux-friendly block format for camera/lens compliance.
 * 
 * Block format ensures Flux respects camera instructions:
 * - [ENV:] Environment description
 * - [SHOT:] Shot type and framing
 * - [LENS:] Lens specs compatible with shot type
 * - [LIGHT:] Lighting conditions
 * - [COLOR:] Color palette
 * - [STYLE:] Visual style
 * - [NEG:] Negative prompts
 */

import type { NodeType, Node, ScenePerspective } from '../../types';
import type { NodeDNA } from '../../../hierarchyAnalysis/types';

/**
 * Generate image prompt for a host node (high-altitude aerial overview)
 */
export function hostImagePrompt(node: Node): string {
  const dna = node.dna || {};

  return `[ENV: "${node.name}"]
${node.description}
${dna.looks || ''}

[SHOT:]
high-altitude aerial establishing shot, drone/aircraft perspective, wide-area regional view, full coverage of terrain, coastline geometry and terrain patterns emphasized, no curvature

[LENS:]
18mm equivalent, f/8, full-frame aerial optics, ~800m-1500m altitude, oblique 25-35° tilt for depth, natural perspective (not satellite), gentle wide-angle expansion

[LIGHT:]
${dna.colorsAndLighting || dna.ambient || 'natural daylight'}, high atmospheric clarity, crisp shadows, minimal haze

[COLOR:]
Dominant: ${dna.dominant || 'natural tones'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}
${dna.palette_bias || ''}

[MOOD:]
${dna.mood || dna.atmosphere || 'expansive, sense of discovery and scale'}

[STYLE:]
${dna.genre || 'realistic'}, professional aerial geography photography, highly detailed, naturalistic, clean composition
Architectural identity: ${dna.architectural_tone || 'varied regional styles'}

[NEG:]
orbital curvature, extreme altitude, satellite mapping look, ground-level perspective, single building focus, interior shots, people in foreground, text, watermark, borders`;
}

/**
 * Generate image prompt for a region node (drone/district overview)
 */
export function regionImagePrompt(node: Node): string {
  const dna = node.dna || {};

  return `[ENV: "${node.name}" district/region]
${node.description}
${dna.looks || ''}

[SHOT:]
aerial establishing shot, high-angle drone perspective, wide panoramic view of entire district, multi-structure composition, no single hero building, vast scale visible

[LENS:]
24mm equivalent, f/5.6, aerial drone optics, 45° oblique tilt, mid-altitude rendering

[LIGHT:]
${dna.colorsAndLighting || dna.ambient || 'natural daylight'}, atmospheric perspective visible

[COLOR:]
Dominant: ${dna.dominant || 'natural'}, Secondary: ${dna.secondary || ''}
${dna.palette_bias || ''}

[MOOD:]
${dna.mood || dna.atmosphere || 'expansive, contextual'}

[STYLE:]
professional urban/landscape photography, detailed scene, atmospheric depth, sense of scale
Architectural Style: ${dna.architectural_tone || ''}
Materials: ${dna.materials || ''}

[NEG:]
ground-level perspective, single building close-up, interior shots, orbital/satellite view, text, watermark`;
}

/**
 * Generate image prompt for a location node (ground-level building)
 */
export function locationImagePrompt(node: Node): string {
  const dna = node.dna || {};
  const structure = (dna.structure || {}) as any;

  const structureDesc = [
    structure.form ? `Form: ${structure.form}` : '',
    structure.roofType ? `Roof: ${structure.roofType}` : '',
    structure.scale ? `Scale: ${structure.scale}` : '',
    structure.orientation ? `Orientation: ${structure.orientation}` : '',
    structure.openings ? `Openings: ${structure.openings}` : ''
  ].filter(Boolean).join(', ');

  return `[ENV: "${node.name}"]
${node.description}
${dna.looks || ''}
${structureDesc ? `Structure: ${structureDesc}` : ''}

[SHOT:]
architectural photography, building exterior in focus, surrounding context visible, inviting entrance visible, ground-level perspective

[LENS:]
35mm equivalent, f/2.8, standard architectural lens, eye-level to slight low angle, natural perspective distortion

[LIGHT:]
${dna.colorsAndLighting || dna.ambient || 'natural daylight'}, warm ambient lighting from windows

[COLOR:]
Dominant: ${dna.dominant || 'natural'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}

[MATERIALS:]
Primary: ${dna.primary_surfaces || ''}
Secondary: ${dna.secondary_surfaces || ''}
Accents: ${dna.accent_features || ''}

[MOOD:]
${dna.mood || dna.atmosphere || 'welcoming, detailed'}

[STYLE:]
professional architectural photography, detailed facade, cinematic composition

[NEG:]
aerial view, satellite view, drone shot, interior shots, text, watermark`;
}

/**
 * Generate image prompt for a niche node (interior)
 */
export function nicheInteriorImagePrompt(node: Node): string {
  const dna = node.dna || {};

  return `[ENV: "${node.name}" interior]
${node.description}
${dna.looks || ''}
Layout: ${dna.spatialLayout || ''}

[SHOT:]
interior photography, room composition showing character and atmosphere, eye-level perspective, inviting and immersive

[LENS:]
24mm equivalent, f/4, wide interior lens, eye-level, minimal distortion

[LIGHT:]
${dna.colorsAndLighting || dna.ambient || 'warm ambient lighting'}, atmospheric interior light

[COLOR:]
Dominant: ${dna.dominant || 'warm'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}

[MATERIALS:]
Floor/Walls: ${dna.primary_surfaces || ''}
Furniture/Fixtures: ${dna.secondary_surfaces || ''}
Decorative Elements: ${dna.accent_features || ''}

[MOOD:]
${dna.mood || dna.atmosphere || 'intimate, lived-in'}

[STYLE:]
interior design photography, detailed textures, atmospheric lighting, sense of depth and space

[NEG:]
exterior view, aerial view, harsh shadows, empty sterile space, text, watermark`;
}

/**
 * Generate image prompt for a niche node (exterior)
 */
export function nicheExteriorImagePrompt(node: Node): string {
  const dna = node.dna || {};

  return `[ENV: "${node.name}" exterior space]
${node.description}
${dna.looks || ''}
Layout: ${dna.spatialLayout || ''}

[SHOT:]
exterior detail shot, close composition of outdoor space, eye-level perspective, showing context and view beyond

[LENS:]
35mm equivalent, f/4, standard lens, eye-level, natural perspective

[LIGHT:]
${dna.colorsAndLighting || dna.ambient || 'natural daylight'}, atmospheric conditions visible

[COLOR:]
Dominant: ${dna.dominant || 'natural'}, Secondary: ${dna.secondary || ''}, Accent: ${dna.accent || ''}

[MATERIALS:]
Surfaces: ${dna.primary_surfaces || ''}
Features: ${dna.secondary_surfaces || ''}
Details: ${dna.accent_features || ''}

[MOOD:]
${dna.mood || dna.atmosphere || 'open, connected to environment'}

[STYLE:]
architectural photography, outdoor space detail, sense of openness, connection to larger environment

[NEG:]
aerial view, satellite view, interior shots, text, watermark`;
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
