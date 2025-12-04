/**
 * Parent Chain DNA Generation Prompt
 * 
 * Generates DNA for all parent nodes in ONE LLM call, working bottom-up.
 * Uses centralized DNA schema for consistency.
 */

import { 
  buildDNAFieldsString,
  DNA_SCENE_FIELDS,
  DNA_CASCADING_FIELDS 
} from '../shared/dnaSchema';

export interface HierarchyNodeInfo {
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
  looks?: string;
  atmosphere?: string;
  mood?: string;
}

/**
 * Generate DNA prompt for parent nodes (working bottom-up from deepest node)
 */
export function parentChainDNAGeneration(
  deepestNodeDNA: any,
  deepestNodeType: 'host' | 'region' | 'location' | 'niche',
  parentNodes: HierarchyNodeInfo[],
  originalPrompt: string
): string {
  if (deepestNodeType === 'host' || parentNodes.length === 0) {
    return '';
  }

  const deepestDNASummary = buildDNASummary(deepestNodeDNA);
  const parentNodesSection = parentNodes
    .map(node => `- ${node.type.toUpperCase()}: ${node.name}\n  Description: ${node.description}`)
    .join('\n\n');

  const nodesToGenerate = parentNodes.map(n => n.type);
  const includesHost = nodesToGenerate.includes('host');
  const includesRegion = nodesToGenerate.includes('region');
  const includesLocation = nodesToGenerate.includes('location');

  // Build JSON templates for each node type needed
  const templates: string[] = [];
  
  if (includesLocation) {
    templates.push(`"location": ${buildNodeTemplate('location')}`);
  }
  if (includesRegion) {
    templates.push(`"region": ${buildNodeTemplate('region')}`);
  }
  if (includesHost) {
    templates.push(`"host": ${buildNodeTemplate('host')}`);
  }

  return `Generate DNA for PARENT nodes using the CASCADING DNA SYSTEM.

THE CASCADING DNA SYSTEM:
- DNA flows DOWN: Host → Region → Location → Niche
- Each node only stores what's DIFFERENT from its parent
- null values = "inherit from parent at runtime"
- You are working BOTTOM-UP: inferring parent styles from the deepest node

ORIGINAL USER INPUT:
${originalPrompt}

DEEPEST NODE DNA (the established "truth" - work backwards from this):
${deepestDNASummary}

PARENT NODES TO GENERATE:
${parentNodesSection}

ABSTRACTION RULES:
- Deepest has specific details → Parent has general style that would produce it
- Example: "polished chrome walls" → Host architectural_tone: "industrial metallic aesthetic"

OUTPUT JSON:
{
  ${templates.join(',\n  ')}
}

CRITICAL GUIDELINES:

1. **SPARSE CASCADING FIELDS**
   - Scene fields: ALWAYS populated for all nodes
   - Cascading fields: null if same as parent would provide
   - Host MUST have ALL cascading fields populated (it's the root)

2. **GENRE ONLY IN HOST**
   - Only host sets genre, all others: "genre": null

3. **COHERENCE**
   - Parent DNA must be compatible with deepest node
   - Work backwards logically

4. **OUTPUT FORMAT**
   - Pure JSON only - no markdown fences
   - Only include nodes that need generation

Generate now:`;
}

/**
 * Build JSON template for a specific node type
 */
function buildNodeTemplate(nodeType: 'host' | 'region' | 'location'): string {
  const dnaFields = buildDNAFieldsString({
    includeStructure: nodeType === 'location',
    genreHandling: nodeType === 'host' ? 'host' : 'null',
    nodeType
  });

  return `{
    "name": "${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Name",
    "description": "2-3 sentences",
    "navigableElements": [${nodeType === 'location' ? '{"type": "door|path", "position": "location", "description": "what it is"}' : ''}],
    "dominantElements": ["Major features"],
    "uniqueIdentifiers": ["Distinctive features"],
    "searchDesc": "75-100 char description",
    "slug": "kebab-case-name",
    "dna": {${dnaFields}
    }
  }`;
}

/**
 * Build a summary of the deepest node's DNA for reference
 */
function buildDNASummary(dna: any): string {
  if (!dna) return 'No DNA available';
  
  const parts: string[] = [];
  
  if (dna.looks) parts.push(`Looks: ${dna.looks}`);
  if (dna.materials) parts.push(`Materials: ${dna.materials}`);
  if (dna.colorsAndLighting) parts.push(`Colors/Lighting: ${dna.colorsAndLighting}`);
  if (dna.atmosphere) parts.push(`Atmosphere: ${dna.atmosphere}`);
  if (dna.mood) parts.push(`Mood: ${dna.mood}`);
  if (dna.architectural_tone) parts.push(`Architectural Tone: ${dna.architectural_tone}`);
  if (dna.cultural_tone) parts.push(`Cultural Tone: ${dna.cultural_tone}`);
  if (dna.palette_bias) parts.push(`Palette Bias: ${dna.palette_bias}`);
  if (dna.dominant) parts.push(`Dominant Color: ${dna.dominant}`);
  
  return parts.join('\n');
}
