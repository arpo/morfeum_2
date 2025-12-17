import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS, DOMINANT_ELEMENTS_RULES, DOMINANT_ELEMENTS_EXAMPLE } from '../shared/dnaSchema';

/**
 * Parent Chain DNA Generation - Optimized
 * Generates DNA for parent nodes in ONE call, working bottom-up from deepest node.
 */

export interface HierarchyNodeInfo {
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
}

export function parentChainDNAGeneration(
  deepestNodeDNA: any,
  deepestNodeType: 'host' | 'region' | 'location' | 'niche',
  parentNodes: HierarchyNodeInfo[],
  originalPrompt: string
): string {
  if (deepestNodeType === 'host' || parentNodes.length === 0) {
    return '';
  }

  const deepestSummary = buildDNASummary(deepestNodeDNA);
  const parentList = parentNodes
    .map(n => `${n.type.toUpperCase()}: ${n.name} - ${n.description}`)
    .join('\n');

  const nodesToGen = parentNodes.map(n => n.type);
  const hasHost = nodesToGen.includes('host');
  const hasRegion = nodesToGen.includes('region');
  const hasLocation = nodesToGen.includes('location');

  return `Generate PARENT DNA working backwards from deepest node.

DEEPEST NODE (established truth):
${deepestSummary}

PARENTS TO GENERATE:
${parentList}

USER: ${originalPrompt}

${DOMINANT_ELEMENTS_RULES}

CRITICAL SCALE RULES (different "looks" per level):
- HOST: AERIAL/SATELLITE view of entire city/world. NO individual buildings, NO facades, NO close-up details. Focus: skyline, geography, distant landmarks as tiny shapes. Example: "A sprawling coastal metropolis stretching along a curved bay, with clusters of tall buildings in the center and green hills beyond."
- REGION: ELEVATED STREET view of district/neighborhood. NO specific building facades. Focus: street character, general architectural style, neighborhood atmosphere. Example: "A bohemian district of narrow streets lined with Victorian shopfronts, street art, and market stalls."
- LOCATION: GROUND LEVEL view of specific building. Show facade, entrance, signage. This is where individual buildings are described.

OUTPUT (pure JSON):
{
  ${hasLocation ? `"location": {
    "name": "Name", "description": "2-3 sentences",
    "navigableElements": [{"type": "door|path", "position": "where", "description": "brief"}],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["distinctive"],
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      "looks": "GROUND LEVEL: building facade, entrance, signage visible",
      "colorsAndLighting": "colors and light",
      "atmosphere": "air, temp, motion",
      "materials": "facade materials",
      "mood": "emotional tone",
      "sounds": "5-10 words",
      "spatialLayout": "building footprint",
      "primary_surfaces": "facade materials",
      "secondary_surfaces": "trim, details",
      "accent_features": "signage, decorations",
      "dominant": "primary color",
      "secondary": "secondary color",
      "accent": "accent color",
      "ambient": "light tone",
      "genre": null,
      "architectural_tone": "style or null",
      "cultural_tone": "who uses or null",
      "palette_bias": "colors or null",
      "flora_base": "plants or null",
      "fauna_base": "animals or null"
    }
  },` : ''}
  ${hasRegion ? `"region": {
    "name": "Name", "description": "2-3 sentences about district character",
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      "looks": "ELEVATED STREET VIEW: district atmosphere, street character, general building styles (NOT specific facades)",
      "colorsAndLighting": "neighborhood light quality",
      "atmosphere": "district air and energy",
      "materials": "common building materials in area",
      "mood": "neighborhood emotional tone",
      "sounds": "district ambient sounds",
      "spatialLayout": "street layout, density",
      "primary_surfaces": "typical facade materials",
      "secondary_surfaces": "street surfaces, common features",
      "accent_features": "neighborhood character elements",
      "dominant": "primary color",
      "secondary": "secondary color",
      "accent": "accent color",
      "ambient": "light tone",
      "genre": null,
      "architectural_tone": "district style or null",
      "cultural_tone": "who lives here or null",
      "palette_bias": "colors or null",
      "flora_base": "plants or null",
      "fauna_base": "animals or null"
    }
  },` : ''}
  ${hasHost ? `"host": {
    "name": "Name", "description": "2-3 sentences about entire city/world",
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      "looks": "AERIAL/SATELLITE VIEW: city skyline, geography, distant landmarks as tiny shapes (NO individual buildings, NO facades, NO close-up details)",
      "colorsAndLighting": "city-wide light and color from above",
      "atmosphere": "city-wide air, weather patterns",
      "materials": "dominant materials visible from distance",
      "mood": "overall city character",
      "sounds": "distant city ambience",
      "spatialLayout": "city layout from above",
      "primary_surfaces": "rooftops, major roads",
      "secondary_surfaces": "water, parks, open spaces",
      "accent_features": "major landmarks visible from distance",
      "dominant": "primary color from aerial view",
      "secondary": "secondary color",
      "accent": "accent color",
      "ambient": "sky/atmospheric light",
      "genre": "REQUIRED",
      "architectural_tone": "REQUIRED",
      "cultural_tone": "REQUIRED",
      "palette_bias": "REQUIRED",
      "flora_base": "REQUIRED",
      "fauna_base": "REQUIRED"
    }
  }` : ''}
}`;
}

function buildDNASummary(dna: any): string {
  if (!dna) return 'No DNA';
  const parts: string[] = [];
  if (dna.looks) parts.push(`Looks: ${dna.looks}`);
  if (dna.materials) parts.push(`Materials: ${dna.materials}`);
  if (dna.architectural_tone) parts.push(`Style: ${dna.architectural_tone}`);
  if (dna.mood) parts.push(`Mood: ${dna.mood}`);
  if (dna.dominant) parts.push(`Colors: ${dna.dominant}`);
  return parts.join(' | ');
}
