import { buildDNAFieldsString } from '../shared/dnaSchema';
import { 
  DOMINANT_ELEMENTS_RULES, 
  DOMINANT_ELEMENTS_EXAMPLE,
  DOMINANT_ELEMENTS_FORMAT,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../shared/elementRules';

/**
 * Static content for caching (~700 tokens)
 * Contains type hints and output guidelines
 */
export const DEEPEST_NODE_DNA_STATIC = `Generate DNA for world node.

TYPE HINTS:
- HOST: Skyline, geography, vast landscapes. MUST set genre.
- REGION: District architecture, street character. No genre.
- LOCATION: Building facade, entrance, signage. No genre.
- NICHE: Interior space, room details. No genre.

${NAVIGABLE_ELEMENTS_RULES}

${DOMINANT_ELEMENTS_RULES}

Be SPECIFIC (not "nice" but "weathered brass with verdigris"). architectural_tone is CRITICAL. Pure JSON only.`;

/**
 * Deepest Node DNA Generation - Optimized for speed
 * Generates DNA for the deepest node (used for image generation)
 */
export function deepestNodeDNAGeneration(
  originalPrompt: string,
  nodeType: 'host' | 'region' | 'location' | 'niche',
  nodeName: string,
  nodeDescription: string,
  classificationData: {
    looks?: string;
    atmosphere?: string;
    mood?: string;
  },
  parentChain: Array<{
    type: string;
    name: string;
    description: string;
  }>
): string {
  const parentContext = parentChain.length > 0
    ? `CONTEXT: ${parentChain.map(p => `${p.type}: ${p.name}`).join(' → ')}\n`
    : '';

  const hints = [classificationData.looks, classificationData.atmosphere, classificationData.mood]
    .filter(Boolean)
    .join('; ');
  const hintsSection = hints ? `HINTS: ${hints}\n` : '';

  const typeHint = getTypeHint(nodeType);
  const dnaFields = buildDNAFieldsString({
    genreHandling: 'conditional',
    descLength: 'short',
    nodeType
  });

  // Only include structural fields for location/niche
  const structuralFields = (nodeType === 'location' || nodeType === 'niche') 
    ? `"navigableElements": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
  "dominantElements": [${nodeType === 'location' ? DOMINANT_ELEMENTS_EXAMPLE : DOMINANT_ELEMENTS_FORMAT.niche}],
  "uniqueIdentifiers": ["3-5 distinctive features"],`
    : '';

  // Build element rules section for location/niche
  const elementRulesSection = (nodeType === 'location' || nodeType === 'niche')
    ? `\n${NAVIGABLE_ELEMENTS_RULES}\n\n${nodeType === 'location' ? DOMINANT_ELEMENTS_RULES : ''}\n`
    : '';

  return `Generate DNA for ${nodeType} "${nodeName}".
${parentContext}${hintsSection}
DESC: ${nodeDescription}
USER: ${originalPrompt}

${typeHint}
${elementRulesSection}
OUTPUT (pure JSON):
{
  "name": "${nodeName}",
  "description": "2-3 sentences",
  ${structuralFields}
  "searchDesc": "75-100 chars",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "dna": {${dnaFields}
  }
}

Be SPECIFIC (not "nice" but "weathered brass with verdigris"). architectural_tone is CRITICAL. Pure JSON only.`;
}

function getTypeHint(nodeType: 'host' | 'region' | 'location' | 'niche'): string {
  switch (nodeType) {
    case 'host':
      return 'CONTENT: Skyline, geography, vast landscapes. MUST set genre.';
    case 'region':
      return 'CONTENT: District architecture, street character. No genre.';
    case 'location':
      return 'CONTENT: Building facade, entrance, signage. No genre.';
    case 'niche':
      return 'CONTENT: Interior space, room details. No genre.';
  }
}
