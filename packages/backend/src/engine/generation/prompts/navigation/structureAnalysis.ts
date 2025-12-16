/**
 * Structure Analysis Prompt - Optimized
 * LLM prompt for analyzing physical/spatial properties of a new space
 * Runs in parallel with DNA analysis for both GO_INSIDE and GOTO commands
 * 
 * Now determines perspective (interior/exterior/open-air) when not provided
 */

import type { NavigationContext, ScenePerspective } from '../../../navigation/types';

export interface StructureAnalysisInput {
  userPrompt: string;
  context: NavigationContext;
  /** If null/undefined, LLM determines perspective. If provided, LLM uses it. */
  perspective?: ScenePerspective | null;
  navigableElements?: Array<{ type: string; position: string; description: string }>;
  furnishing?: string[];
}

export function structureAnalysisPrompt(input: StructureAnalysisInput): string {
  const { userPrompt, context, perspective } = input;

  const parentDna = context.parentNode?.dna as any;
  const currentDna = context.currentNode.dna as any;
  const currentNodeData = context.currentNode.data as any;
  const parentStructure = currentNodeData?.structure || parentDna?.structure || currentDna?.structure;
  
  // Get parent location's spaceType if available (important for perspective determination)
  const parentSpaceType = currentNodeData?.spaceType || 'unknown';

  // If perspective is provided, use fixed perspective instructions
  // If not provided (null), include perspective determination instructions
  const perspectiveSection = perspective 
    ? `PERSPECTIVE: ${perspective.toUpperCase()} (user-specified)`
    : `STEP 1: DETERMINE PERSPECTIVE
Analyze the context and user input to determine the appropriate perspective:

- INTERIOR: Enclosed space with roof/ceiling (room, hall, chamber, cave, vehicle interior)
- EXTERIOR: Fully open outdoor space (park path, plaza, sculpture garden, forest clearing)  
- OPEN-AIR: Semi-enclosed with open sky (balcony, terrace, rooftop, covered patio, pergola)

PERSPECTIVE CLUES:
- Parent location spaceType: "${parentSpaceType}"
- If parent is "exterior" and user isn't entering a building → likely EXTERIOR or OPEN-AIR
- If entering a structure/building → likely INTERIOR
- If balcony/terrace/rooftop mentioned → OPEN-AIR
- If garden/plaza/path/clearing mentioned → EXTERIOR`;

  const perspectiveRules = perspective
    ? ''
    : `
PERSPECTIVE RULES:
- For EXTERIOR: roofType MUST be "open-sky", no ceiling
- For OPEN-AIR: roofType MUST be "open-sky", may have partial walls/railings
- For INTERIOR: roofType is domed/flat/vaulted/etc, enclosed`;

  return `Analyze space and determine physical structure.

${perspectiveSection}

CONTEXT:
Current: "${context.currentNode.name}" (${context.currentNode.type})
${context.parentNode ? `Parent: "${context.parentNode.name}" (${context.parentNode.type})` : ''}

PARENT DATA:
- Description: "${context.currentNode.data?.description || 'none'}"
- Cultural tone: "${currentDna?.cultural_tone || 'none'}"
- Looks: "${currentDna?.looks || 'none'}"
- DominantElements: ${JSON.stringify(currentNodeData?.dominantElements?.slice(0, 3) || [])}
- Form: ${parentStructure?.form || 'determine from looks'}
- Scale: ${parentStructure?.scale || 'determine'}
- Functional type: ${parentStructure?.functionalType || 'determine from cultural_tone'}
- Opening shape: ${parentStructure?.openingShape || 'determine from looks'}

USER INPUT: "${userPrompt}"

STRUCTURE RULES:
1. FORM: Interior MUST match parent form (rectangular→rectangular, round→round)
2. SCALE: Interior/open-air ≤ parent scale (small parent = small space only)
3. ORIENTATION: Horizontal parent → horizontal/wide space (NEVER vertical)
4. OPENINGS: Solid exterior (dome/sphere/pod) → "none" (no windows)
5. FUNCTIONAL TYPE: Determined by cultural_tone/description, NOT appearance
${perspectiveRules}

SCALE HINTS:
- small: 2-4m (pods, booths, cabins)
- medium: 4-10m (rooms, shops, cafés)
- large: 10-30m+ (halls, cathedrals, plazas)

OUTPUT (pure JSON):
{
  "name": "Space Name",
  "perspective": "${perspective || 'interior|exterior|open-air'}",
  "structure": {
    "form": "rectangular|round|cylindrical|spherical|organic|arched|gothic|irregular",
    "roofType": "domed|flat|vaulted|pitched|arched|open-sky|null",
    "scale": "small|medium|large",
    "orientation": "vertical|horizontal|wide|cubic",
    "openings": "large-glass|arched-windows|narrow-slits|open-passages|minimal|none",
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
