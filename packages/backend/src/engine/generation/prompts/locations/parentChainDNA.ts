import { 
  DOMINANT_ELEMENTS_RULES, 
  DOMINANT_ELEMENTS_EXAMPLE,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../shared/elementRules';

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

  const locationElementRules = hasLocation 
    ? `\n${NAVIGABLE_ELEMENTS_RULES}\n\n${DOMINANT_ELEMENTS_RULES}\n` 
    : '';

  return `Generate PARENT DNA backwards from deepest node.

DEEPEST NODE: ${deepestSummary}

PARENTS TO GENERATE:
${parentList}

USER: ${originalPrompt}

SCALE RULES (different view per level):
- HOST: Aerial/satellite view. NO individual buildings. Focus: skyline, geography, distant landmarks.
- REGION: Elevated street view. NO specific facades. Focus: street character, neighborhood atmosphere.
- LOCATION: Ground level, specific building. Show facade, entrance, signage.
${locationElementRules}
OUTPUT (pure JSON):
{
  ${hasLocation ? `"location": {
    "name": "", "description": "2-3 sentences",
    "navigableElements": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["distinctive"],
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      "looks": "GROUND LEVEL: facade, entrance, signage",
      "colorsAndLighting": "", "atmosphere": "", "materials": "",
      "mood": "", "sounds": "", "spatialLayout": "",
      "primary_surfaces": "", "secondary_surfaces": "", "accent_features": "",
      "dominant": "", "secondary": "", "accent": "", "ambient": "",
      "genre": null, "architectural_tone": "", "cultural_tone": "",
      "palette_bias": "", "flora_base": "", "fauna_base": ""
    }
  },` : ''}
  ${hasRegion ? `"region": {
    "name": "", "description": "2-3 sentences",
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      "looks": "ELEVATED VIEW: district atmosphere, street character",
      "colorsAndLighting": "", "atmosphere": "", "materials": "",
      "mood": "", "sounds": "", "spatialLayout": "",
      "primary_surfaces": "", "secondary_surfaces": "", "accent_features": "",
      "dominant": "", "secondary": "", "accent": "", "ambient": "",
      "genre": null, "architectural_tone": "", "cultural_tone": "",
      "palette_bias": "", "flora_base": "", "fauna_base": ""
    }
  },` : ''}
  ${hasHost ? `"host": {
    "name": "", "description": "2-3 sentences",
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      "looks": "AERIAL VIEW: skyline, geography (NO individual buildings)",
      "colorsAndLighting": "", "atmosphere": "", "materials": "",
      "mood": "", "sounds": "", "spatialLayout": "",
      "primary_surfaces": "", "secondary_surfaces": "", "accent_features": "",
      "dominant": "", "secondary": "", "accent": "", "ambient": "",
      "genre": "REQUIRED", "architectural_tone": "REQUIRED", "cultural_tone": "REQUIRED",
      "palette_bias": "REQUIRED", "flora_base": "REQUIRED", "fauna_base": "REQUIRED"
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
