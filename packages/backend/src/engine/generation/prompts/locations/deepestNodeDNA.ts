import { buildDNAFieldsString } from '../shared/dnaSchema';

/**
 * Deepest Node DNA Generation Prompt (Optimized for Speed)
 * 
 * Generates FULL DNA for the deepest node in a world tree hierarchy.
 * This DNA is used to generate an image, so be RICH and DETAILED.
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
  // Build compact parent context
  const parentContext = parentChain.length > 0
    ? `\nCONTEXT: ${parentChain.map(p => `${p.type}: ${p.name}`).join(' → ')}\n`
    : '';

  // Build compact classification hints
  const hints = [classificationData.looks, classificationData.atmosphere, classificationData.mood]
    .filter(Boolean)
    .join('; ');
  const hintsSection = hints ? `\nHINTS: ${hints}\n` : '';

  // Compact type instruction
  const typeHint = getCompactTypeHint(nodeType);

  // Build DNA fields using shared schema
  const dnaFields = buildDNAFieldsString({
    includeStructure: nodeType === 'location',
    genreHandling: 'conditional',
    nodeType
  });

  return `Generate DNA for a ${nodeType} named "${nodeName}".
${parentContext}${hintsSection}
DESCRIPTION: ${nodeDescription}
USER REQUEST: ${originalPrompt}

${typeHint}

OUTPUT (JSON only, no markdown):
{
  "name": "${nodeName}",
  "description": "2-3 sentences about purpose and character",
  "navigableElements": [{"type": "door|passage|stairs|archway|path", "position": "location", "description": "brief"}],
  "dominantElements": ["3-5 major features"],
  "uniqueIdentifiers": ["3-5 distinctive features"],
  "searchDesc": "75-100 char description",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "dna": {${dnaFields}
  }
}

RULES:
- Be SPECIFIC (not "nice" but "weathered brass with verdigris patina")
- architectural_tone is CRITICAL for image generation
- Pure JSON output, no explanations`;
}

/**
 * Get compact type hint
 */
function getCompactTypeHint(nodeType: 'host' | 'region' | 'location' | 'niche'): string {
  switch (nodeType) {
    case 'host':
      return 'TYPE: HOST (world/city level, aerial view, MUST set genre, all cascading fields required)';
    case 'region':
      return 'TYPE: REGION (district/area level, street-level view, no genre)';
    case 'location':
      return 'TYPE: LOCATION (building exterior, facade/entrance view, no genre)';
    case 'niche':
      return 'TYPE: NICHE (interior space, room view from entrance, no genre)';
  }
}
