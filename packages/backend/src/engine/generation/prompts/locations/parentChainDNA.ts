import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../shared/dnaSchema';

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

  // Compact DNA fields template
  const dnaTemplate = `"looks": "visual description",
    "colorsAndLighting": "colors and light",
    "atmosphere": "air, temp, motion",
    "materials": "main materials",
    "mood": "emotional tone",
    "sounds": "5-10 words",
    "spatialLayout": "space shape",
    "primary_surfaces": "main surfaces",
    "secondary_surfaces": "supporting materials",
    "accent_features": "decorative details",
    "dominant": "primary color",
    "secondary": "secondary color",
    "accent": "accent color",
    "ambient": "light tone"`;

  return `Generate PARENT DNA working backwards from deepest node.

DEEPEST NODE (established truth):
${deepestSummary}

PARENTS TO GENERATE:
${parentList}

USER: ${originalPrompt}

RULES:
- Host MUST set genre + all cascading fields
- Region/Location: set cascading to null if same as parent
- Scene fields always populated
- Abstract UP: child style → parent that produces it

OUTPUT (pure JSON):
{
  ${hasLocation ? `"location": {
    "name": "Name", "description": "2-3 sentences",
    "navigableElements": [{"type": "door|path", "position": "where", "description": "brief"}],
    "dominantElements": ["features"], "uniqueIdentifiers": ["distinctive"],
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      ${dnaTemplate},
      "genre": null,
      "architectural_tone": "style or null",
      "cultural_tone": "who uses or null",
      "palette_bias": "colors or null",
      "flora_base": "plants or null",
      "fauna_base": "animals or null"
    }
  },` : ''}
  ${hasRegion ? `"region": {
    "name": "Name", "description": "2-3 sentences",
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      ${dnaTemplate},
      "genre": null,
      "architectural_tone": "style or null",
      "cultural_tone": "who uses or null",
      "palette_bias": "colors or null",
      "flora_base": "plants or null",
      "fauna_base": "animals or null"
    }
  },` : ''}
  ${hasHost ? `"host": {
    "name": "Name", "description": "2-3 sentences",
    "searchDesc": "75-100 chars", "slug": "kebab-case",
    "dna": {
      ${dnaTemplate},
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
