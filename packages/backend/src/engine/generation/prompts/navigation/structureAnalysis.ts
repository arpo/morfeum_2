/**
 * Structure Analysis Prompt - Optimized
 * LLM prompt for analyzing physical/spatial properties of a new space
 * Runs in parallel with DNA analysis for both GO_INSIDE and GOTO commands
 */

import type { NavigationContext } from '../../../navigation/types';

export interface StructureAnalysisInput {
  userPrompt: string;
  context: NavigationContext;
  perspective: 'interior' | 'exterior';
  navigableElements?: Array<{ type: string; position: string; description: string }>;
  furnishing?: string[];
}

export function structureAnalysisPrompt(input: StructureAnalysisInput): string {
  const { userPrompt, context, perspective } = input;

  const parentDna = context.parentNode?.dna as any;
  const currentDna = context.currentNode.dna as any;
  const currentNodeData = context.currentNode.data as any;
  const parentStructure = currentNodeData?.structure || parentDna?.structure || currentDna?.structure;

  return `Analyze space and determine physical structure.

CONTEXT: Creating ${perspective} space.
Current: "${context.currentNode.name}" (${context.currentNode.type})
${context.parentNode ? `Parent: "${context.parentNode.name}" (${context.parentNode.type})` : ''}

PARENT DATA:
- Description: "${context.currentNode.data?.description || 'none'}"
- Cultural tone: "${currentDna?.cultural_tone || 'none'}"
- Looks: "${currentDna?.looks || 'none'}"
- Form: ${parentStructure?.form || 'determine from looks'}
- Scale: ${parentStructure?.scale || 'determine'}
- Functional type: ${parentStructure?.functionalType || 'determine from cultural_tone'}
- Opening shape: ${parentStructure?.openingShape || 'determine from looks'}

USER INPUT: "${userPrompt}"

RULES (critical):
1. FORM: Interior MUST match parent form (rectangular→rectangular, round→round)
2. SCALE: Interior ≤ parent scale (small parent = small interior only)
3. ORIENTATION: Horizontal parent → horizontal/wide interior (NEVER vertical)
4. OPENINGS: Solid exterior (dome/sphere/pod) → "none" (no windows)
5. FUNCTIONAL TYPE: Determined by cultural_tone/description, NOT appearance

SCALE HINTS:
- small: 2-4m (pods, booths, cabins)
- medium: 4-10m (rooms, shops, cafés)
- large: 10-30m+ (halls, cathedrals)

OUTPUT (pure JSON):
{
  "name": "Space Name",
  "perspective": "${perspective}",
  "structure": {
    "form": "rectangular|round|cylindrical|spherical|organic|arched|gothic|irregular",
    "roofType": "domed|flat|vaulted|pitched|arched|open-sky|null",
    "scale": "small|medium|large",
    "orientation": "vertical|horizontal|wide|cubic",
    "openings": "large-glass|arched-windows|narrow-slits|minimal|none",
    "openingShape": "rectangular|circular|arched|mixed|irregular",
    "functionalType": "residential|commercial|religious|industrial|civic|entertainment",
    "spatialLayout": "1-2 sentence physical description",
    "requiredElements": ["user-specified elements that MUST appear"],
    "navigableElements": [{...}],
    NOTE: FIRST navigableElement = MAIN ENTRANCE for GO_INSIDE.
    "dominantElements": ["FIRST: main enterable structure if any, then 3-4 other major features"],
    "uniqueIdentifiers": ["2-4 distinctive features"]
  },
  "description": "Brief space description"
}`;
}

/**
 * Parse user input to extract required elements
 */
export function extractRequiredElements(userPrompt: string): string[] {
  const elements: string[] = [];
  
  const includeMatch = userPrompt.match(/include[:\s]+(.+?)(?:\.|$)/gi);
  if (includeMatch) {
    includeMatch.forEach(match => {
      const content = match.replace(/include[:\s]+/i, '').trim();
      elements.push(...content.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 0));
    });
  }
  
  const withMatches = userPrompt.match(/with (?:a |an |the )?([^,.]+)/gi);
  if (withMatches) {
    withMatches.forEach(match => {
      const item = match.replace(/^with (?:a |an |the )?/i, '').trim();
      if (item.length > 3 && item.length < 100) elements.push(item);
    });
  }
  
  return [...new Set(elements)];
}
