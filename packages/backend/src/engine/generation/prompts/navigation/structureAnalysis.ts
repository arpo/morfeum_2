/**
 * Structure Analysis Prompt - Optimized
 * LLM prompt for analyzing physical/spatial properties of a new space
 * Runs in parallel with DNA analysis for both GO_INSIDE and GOTO commands
 * 
 * Now determines perspective (interior/exterior/open-air) when not provided
 */

import type { NavigationContext, ScenePerspective } from '../../../navigation/types';
import { DOMINANT_ELEMENTS_RULES, DOMINANT_ELEMENTS_EXAMPLE } from '../../prompts/shared/dnaSchema';

export interface StructureAnalysisInput {
  userPrompt: string;
  context: NavigationContext;
  /** If null/undefined, LLM determines perspective. If provided, LLM uses it. */
  perspective?: ScenePerspective | null;
  navigableElements?: Array<{ type: string; position: string; description: string }>;
  furnishing?: string[];
  /** True for GOTO command (creates new location based on user destination) */
  isGotoCommand?: boolean;
  /** True when GO_INSIDE has a specific target object (e.g., "alien spaceship") */
  hasSpecificTarget?: boolean;
  /** The specific target object when hasSpecificTarget is true */
  targetObject?: string;
  /** Rich seed data from parent's dominantElements (shape, scale, materials) */
  targetSeed?: string;
}

export function structureAnalysisPrompt(input: StructureAnalysisInput): string {
  const { userPrompt, context, perspective, isGotoCommand } = input;

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
Analyze the USER INPUT to determine the appropriate perspective:

- INTERIOR: Enclosed space with roof/ceiling (room, hall, chamber, cave, vehicle interior)
- EXTERIOR: Fully open outdoor space (park, plaza, garden, forest, street, path)  
- OPEN-AIR: Semi-enclosed with open sky (balcony, terrace, rooftop, covered patio, pergola)

PERSPECTIVE CLUES from USER INPUT:
- If park/garden/plaza/forest/street/path → EXTERIOR
- If room/hall/chamber/building interior → INTERIOR
- If balcony/terrace/rooftop mentioned → OPEN-AIR`;

  const perspectiveRules = perspective
    ? ''
    : `
PERSPECTIVE RULES:
- For EXTERIOR: roofType MUST be "open-sky", no ceiling
- For OPEN-AIR: roofType MUST be "open-sky", may have partial walls/railings
- For INTERIOR: roofType is domed/flat/vaulted/etc, enclosed`;

  // ═══════════════════════════════════════════════════════════════════════════
  // GOTO COMMAND: User's destination text is PRIMARY - parent is just for style
  // ═══════════════════════════════════════════════════════════════════════════
  if (isGotoCommand) {
    return `Create a NEW LOCATION based on the user's destination.

CRITICAL: The USER INPUT describes the DESTINATION to create. The name and type should match what the user asked for.

${perspectiveSection}

USER INPUT (THIS IS THE DESTINATION): "${userPrompt}"

STYLE CONTEXT (for visual consistency only):
- World style: "${currentDna?.architectural_tone || currentDna?.genre || 'default'}"
- Palette: "${currentDna?.palette_bias || 'determine from destination'}"

NAMING RULES:
- Extract the destination name from USER INPUT
- "to the park" → name should be "The Park" or a specific park name
- "the old church" → name should be "The Old Church" or a specific church name
- Keep it simple and match what the user asked for
${perspectiveRules}

SCALE HINTS:
- small: 2-4m (pods, booths, cabins)
- medium: 4-10m (rooms, shops, cafés)  
- large: 10-30m+ (parks, plazas, halls)

OUTPUT (pure JSON):
{
  "name": "Destination Name (from USER INPUT)",
  "perspective": "${perspective || 'interior|exterior|open-air'}",
  "structure": {
    "form": "rectangular|round|organic|irregular",
    "roofType": "open-sky|domed|flat|vaulted|pitched|arched|null",
    "scale": "small|medium|large",
    "orientation": "vertical|horizontal|wide|cubic",
    "openings": "large-glass|arched-windows|narrow-slits|open-passages|minimal|none",
    "openingShape": "rectangular|circular|arched|mixed|irregular",
    "functionalType": "residential|commercial|religious|industrial|civic|entertainment|natural",
    "spatialLayout": "1-2 sentence description of the DESTINATION",
    "requiredElements": ["elements from USER INPUT that MUST appear"],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["distinctive features of this DESTINATION"]
  },
  "description": "Brief description of the DESTINATION"
}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GO_INSIDE WITH SPECIFIC TARGET: Create interior OF the target object
  // ═══════════════════════════════════════════════════════════════════════════
  if (input.hasSpecificTarget && input.targetObject) {
    const seedSection = input.targetSeed 
      ? `
TARGET SEED DATA (CRITICAL - Use this to determine form, scale, materials):
${input.targetSeed}

PARSE THE SEED: Extract shape, scale, floor materials, wall materials, lighting from the seed data above.
` 
      : '';

    return `Create the INTERIOR OF A SPECIFIC OBJECT/CONTAINER.

CRITICAL: The USER INPUT specifies what object/container to enter. Create the INTERIOR of that specific thing.

${perspectiveSection}

TARGET OBJECT TO ENTER: "${input.targetObject}"
${seedSection}
PARENT CONTEXT (for atmosphere/style only):
- Location: "${context.currentNode.name}"
- Cultural tone: "${currentDna?.cultural_tone || 'none'}"
- Architectural style: "${currentDna?.architectural_tone || 'none'}"
- Palette: "${currentDna?.palette_bias || 'none'}"

NAMING RULES:
- Name should be "Interior of [TARGET OBJECT]" or similar
- Example: "alien spaceship" → "Alien Spaceship Interior" or "Spaceship Cockpit"
- The name must clearly indicate it's the inside of the target object

STRUCTURE RULES:
- FORM: Determined by the TARGET OBJECT'S shape (spaceship → cylindrical/spherical, vehicle → rectangular, etc.)
- SCALE: Appropriate for the TARGET OBJECT (small vehicle = small interior, large ship = medium/large)
- DO NOT copy parent space's structure - focus on what makes sense for the TARGET OBJECT
- Inherit only atmosphere/cultural style from parent, NOT physical structure
${perspectiveRules}

SCALE HINTS:
- small: 2-4m (pods, small vehicles, cabins)
- medium: 4-10m (spaceships, large vehicles, aircraft)
- large: 10-30m+ (cruise ships, large spacecraft)

OUTPUT (pure JSON):
{
  "name": "Interior name that clearly indicates it's inside the TARGET OBJECT",
  "perspective": "${perspective || 'interior'}",
  "structure": {
    "form": "Form appropriate for TARGET OBJECT interior (cylindrical for ships, rectangular for rooms, etc.)",
    "roofType": "domed|flat|vaulted|arched (appropriate for the TARGET OBJECT)",
    "scale": "Appropriate scale for the TARGET OBJECT",
    "orientation": "vertical|horizontal|wide|cubic",
    "openings": "windows/viewports appropriate for TARGET OBJECT",
    "openingShape": "circular|rectangular|arched|mixed (appropriate for TARGET OBJECT)",
    "functionalType": "Determined by TARGET OBJECT purpose",
    "spatialLayout": "Description of the TARGET OBJECT's interior layout",
    "requiredElements": ["Key features that MUST be in the TARGET OBJECT's interior"],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["Distinctive features of this TARGET OBJECT"]
  },
  "description": "Brief description of the TARGET OBJECT's interior"
}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GO_INSIDE GENERIC: Create interior space that matches parent structure
  // ═══════════════════════════════════════════════════════════════════════════
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
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
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
