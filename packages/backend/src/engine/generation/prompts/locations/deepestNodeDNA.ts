import { buildDNAFieldsString } from '../shared/dnaSchema';

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
    ? `\nCONTEXT: ${parentChain.map(p => `${p.type}: ${p.name}`).join(' → ')}\n`
    : '';

  const hints = [classificationData.looks, classificationData.atmosphere, classificationData.mood]
    .filter(Boolean)
    .join('; ');
  const hintsSection = hints ? `\nHINTS: ${hints}\n` : '';

  const typeHint = getTypeHint(nodeType);
  const dnaFields = buildDNAFieldsString({
    genreHandling: 'conditional',
    descLength: 'short',
    nodeType
  });

  // Only include structural fields for location/niche
  const structuralFields = (nodeType === 'location' || nodeType === 'niche') 
    ? `"navigableElements": [{"type": "door|passage|stairs", "position": "where", "description": "brief"}],
  "dominantElements": ["3-5 major features"],
  "uniqueIdentifiers": ["3-5 distinctive features"],`
    : '';

  return `Generate DNA for ${nodeType} "${nodeName}".
${parentContext}${hintsSection}
DESC: ${nodeDescription}
USER: ${originalPrompt}

${typeHint}

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

RULES: Be SPECIFIC (not "nice" but "weathered brass with verdigris"). architectural_tone is CRITICAL. Pure JSON only.`;
}

function getTypeHint(nodeType: 'host' | 'region' | 'location' | 'niche'): string {
  switch (nodeType) {
    case 'host':
      return 'VIEW: VAST AERIAL (satellite/airplane). Epic panoramic. MUST set genre.';
    case 'region':
      return 'VIEW: DISTRICT (rooftop/drone height). Street-level elevated. No genre.';
    case 'location':
      return 'VIEW: BUILDING EXTERIOR (facade/entrance). No genre.';
    case 'niche':
      return 'VIEW: INTERIOR (room from entrance). No genre.';
  }
}
