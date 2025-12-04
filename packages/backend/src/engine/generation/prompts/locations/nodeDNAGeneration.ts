/**
 * Node DNA Generation Prompt
 * 
 * Generates simplified, flat DNA structure for a single node.
 * Uses centralized DNA schema for consistency.
 */

import { 
  buildDNAFieldsString, 
  buildParentContextSection,
  buildGuidelines,
  type NodeType 
} from '../shared/dnaSchema';

/**
 * Generate DNA prompt for a single node
 * 
 * @param originalPrompt - Original user input
 * @param nodeName - Name of the node to generate DNA for
 * @param nodeType - Type of node (host, region, location, niche)
 * @param nodeDescription - Description of the node
 * @param parentContext - Optional parent context to inherit from
 * @returns Prompt string for LLM
 */
export function nodeDNAGeneration(
  originalPrompt: string,
  nodeName: string,
  nodeType: string,
  nodeDescription: string,
  parentContext?: {
    genre?: string;
    architectural_tone?: string;
    cultural_tone?: string;
    dominant?: string;
    mood?: string;
    materials_base?: string;
    palette_bias?: string;
  }
): string {
  const contextSection = buildParentContextSection(parentContext);
  const includeStructure = nodeType === 'location';
  const dnaFields = buildDNAFieldsString({ 
    includeStructure, 
    genreHandling: 'conditional', 
    nodeType 
  });
  const guidelines = buildGuidelines(includeStructure);

  return `Interpret the user's description into a DNA structure with cascading style attributes.

OBJECTIVE: Create visual/atmospheric DNA that separates scene-specific details from inheritable style attributes.

NODE INFORMATION:
Name: ${nodeName}
Type: ${nodeType}
Description: ${nodeDescription}
${contextSection}
ORIGINAL USER INPUT:
${originalPrompt}

OUTPUT JSON STRUCTURE:

{
  "name": "${nodeName}",
  "description": "Brief description of this node",
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window", "position": "location in scene", "description": "what it is"}
  ],
  "dominantElements": ["List of major positioned objects/features in scene"],
  "uniqueIdentifiers": ["List of distinctive visual features that make this place recognizable"],
  "searchDesc": "75-100 char search-friendly description",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "dna": {${dnaFields}
  }
}

CRITICAL GUIDELINES
${guidelines}

**Structure Field Rules:**
- LOCATIONS: MUST populate structure for buildings/constructed exteriors
- NICHES: Set structure to null - inherit from parent location
- REGIONS/HOSTS: Set to null
- Natural landscapes: Set to null

**Output Rules:**
- Pure JSON only (no markdown, code fences, or comments)
- All scene fields required
- Cascading fields can be null for inheritance`;
}
