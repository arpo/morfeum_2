/**
 * Structure Analysis Prompt - Optimized
 * LLM prompt for analyzing physical/spatial properties of a new space
 * Runs in parallel with DNA analysis for both GO_INSIDE and GOTO commands
 * 
 * Now determines perspective (interior/exterior/open-air) when not provided
 * Also determines containerType (building/vehicle-car/vehicle-boat/natural/tent-like)
 */

import type { NavigationContext, ScenePerspective } from '../../../navigation/types';
import { 
  DOMINANT_ELEMENTS_RULES, 
  DOMINANT_ELEMENTS_EXAMPLE,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../shared/elementRules';
import { findTargetElementInfo, extractRequiredElements, type TargetElementInfo } from './elementAnalysis';
import { getContainerTypeDescriptions } from '../../shared/spaceTypeRegistry';

export interface StructureAnalysisInput {
  userPrompt: string;
  context: NavigationContext;
  /** If null/undefined, LLM determines perspective. If provided, LLM uses it. */
  perspective?: ScenePerspective | null;
  navigableElements?: Array<{ type: string; position: string; description: string }>;
  furnishing?: string[];
  /** True for GOTO command (creates new location based on user destination) */
  isGotoCommand?: boolean;
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

  // Container type determination (LLM decides based on context)
  const containerTypeSection = `
CONTAINER TYPE DETERMINATION:
Analyze what type of container/enclosure this space is:
${getContainerTypeDescriptions()}

CONTAINER TYPE RULES:
- Analyze the USER INPUT and CONTEXT to determine the container type
- "go inside the car" → vehicle-car
- "the ship's cabin" → vehicle-boat
- "the deck" (on a boat) → vehicle-boat
- "a room", "the kitchen", "the basement" → building
- "the tent", "the pavilion" → tent-like
- Most spaces default to "building" unless clearly a vehicle, natural area, or tent`;

  // ═══════════════════════════════════════════════════════════════════════════
  // GOTO COMMAND: User's destination text is PRIMARY - parent is just for style
  // ═══════════════════════════════════════════════════════════════════════════
  if (isGotoCommand) {
    return `Create a NEW LOCATION based on the user's destination.

CRITICAL: The USER INPUT describes the DESTINATION to create. The name and type should match what the user asked for.

${perspectiveSection}

${containerTypeSection}

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

ELEVATION RULES:
Analyze the USER INPUT to determine the vertical positioning of the space:
- ground-level: Standard ground floor or surface level (default for most spaces)
- rooftop: On top of a building (rooftop, roof terrace, helipad)
- elevated: Above ground but not a rooftop (tower room, penthouse, upper floor, observation deck, treehouse)
- underground: Below surface (basement, cellar, bunker, cave, crypt, tunnel)
- floating: Suspended in air/space (cloud platform, space station, floating island)
- suspended: Hanging structure (suspended walkway, hanging garden, cable car station)

ELEVATION CLUES from USER INPUT:
- "rooftop", "roof terrace", "on the roof" → rooftop
- "tower room", "penthouse", "observation deck", "upper floor" → elevated
- "basement", "cellar", "underground", "crypt" → underground
- Default/standard spaces → ground-level

${NAVIGABLE_ELEMENTS_RULES}

${DOMINANT_ELEMENTS_RULES}

OUTPUT (pure JSON):
{
  "name": "Destination Name (from USER INPUT)",
  "perspective": "${perspective || 'interior|exterior|open-air'}",
  "containerType": "building|vehicle-car|vehicle-boat|natural|tent-like",
  "structure": {
    "form": "rectangular|round|organic|irregular",
    "roofType": "open-sky|domed|flat|vaulted|pitched|arched|null",
    "scale": "small|medium|large",
    "orientation": "vertical|horizontal|wide|cubic",
    "openings": "large-glass|arched-windows|narrow-slits|open-passages|minimal|none",
    "openingShape": "rectangular|circular|arched|mixed|irregular",
    "functionalType": "residential|commercial|religious|industrial|civic|entertainment|natural",
    "elevation": "ground-level|rooftop|elevated|underground|floating|suspended",
    "spatialLayout": "1-2 sentence description of the DESTINATION",
    "requiredElements": ["elements from USER INPUT that MUST appear"],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["distinctive features of this DESTINATION"]
  },
  "description": "Brief description of the DESTINATION. CRITICAL: Match perspective - if exterior/open-air, describe the EXTERIOR view; if interior, describe the INTERIOR view. Do NOT say 'interior' when perspective is exterior."
}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GO_INSIDE COMMAND: Create interior space
  // If entering a specific element (like a ship inside a hangar), use THAT element's
  // properties. Otherwise, use parent structure properties.
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Check if user input references a dominant element in the current space
  // This enables entering objects WITHIN a space (like the ship inside a hangar)
  const dominantElements = currentNodeData?.dominantElements || [];
  const targetElementInfo = findTargetElementInfo(userPrompt, dominantElements);
  
  // Build interior materials string if available
  const materialsSection = targetElementInfo?.interiorMaterials 
    ? `\nINTERIOR MATERIALS (MANDATORY - use these exact materials):
   - WALLS: ${targetElementInfo.interiorMaterials.walls || 'match element style'}
   - FLOOR: ${targetElementInfo.interiorMaterials.floor || 'match element style'}
   - CEILING: ${targetElementInfo.interiorMaterials.ceiling || 'match element style'}`
    : '';

  // Build structure rules based on whether we're entering a specific element
  const structureRules = targetElementInfo
    ? `CRITICAL: You are entering "${targetElementInfo.name}" which is an OBJECT WITHIN "${context.currentNode.name}".
The new space is the INTERIOR OF "${targetElementInfo.name}", NOT another "${context.currentNode.name}".

TARGET ELEMENT PROPERTIES (use these, NOT parent space):
${targetElementInfo.properties}

STRUCTURE RULES FOR TARGET ELEMENT INTERIOR:
1. FORM: Match the TARGET element's shape (${targetElementInfo.shape || 'determine from element description'})
2. ORIENTATION: Interior layout follows element orientation (${targetElementInfo.orientation || 'determine from element'})
   - vertical orientation → multi-level interior, vertical stacking
   - horizontal orientation → long corridor/cabin layout
   - flowing orientation → organic, curving interior spaces
   - compact orientation → single room, efficient layout
3. SCALE: Interior of the TARGET element (appropriate for ${targetElementInfo.scale || 'the element size'})
4. OPENINGS: Windows/doors type = ${targetElementInfo.openings || 'match element style'} (circular-portholes for ships, arched-windows for cathedrals, etc.)
5. ATMOSPHERE: ${targetElementInfo.internalAtmosphere || 'match the element style'}
6. EXTERIOR SURFACE: ${targetElementInfo.surfaces || 'element materials'} (for exterior reference only)
${materialsSection}
7. The space should feel like being INSIDE "${targetElementInfo.name}"
8. Do NOT recreate "${context.currentNode.name}" - create the interior of "${targetElementInfo.name}"
9. Do NOT use materials from "${context.currentNode.name}" - use the TARGET element's materials

CRITICAL - DOMINANT ELEMENTS FOR INTERIOR:
- Do NOT include "${targetElementInfo.name}" as a dominant element - you are INSIDE it!
- dominantElements should be OBJECTS/FURNITURE/FIXTURES inside this space (tables, chairs, equipment, machinery)
- For interiors, use format: "object_name: brief description of the object"
- NOT enterable structures - those are for exterior views only`
    : `STRUCTURE RULES:
1. FORM: Interior MUST match parent form (rectangular→rectangular, round→round)
2. SCALE: Interior/open-air ≤ parent scale (small parent = small space only)
3. ORIENTATION: Horizontal parent → horizontal/wide space (NEVER vertical)
4. OPENINGS: Solid exterior (dome/sphere/pod) → "none" (no windows)
5. FUNCTIONAL TYPE: Determined by cultural_tone/description, NOT appearance`;

  return `Analyze space and determine physical structure.

${perspectiveSection}

${containerTypeSection}

CONTEXT:
Current: "${context.currentNode.name}" (${context.currentNode.type})
${context.parentNode ? `Parent: "${context.parentNode.name}" (${context.parentNode.type})` : ''}

${targetElementInfo ? `
=== ENTERING SPECIFIC ELEMENT ===
You are creating the INTERIOR of "${targetElementInfo.name}" which exists WITHIN "${context.currentNode.name}".
This is NOT another "${context.currentNode.name}". This is the INSIDE of "${targetElementInfo.name}".

TARGET ELEMENT: ${targetElementInfo.fullDescription}
` : `PARENT DATA:
- Description: "${context.currentNode.data?.description || 'none'}"
- Cultural tone: "${currentDna?.cultural_tone || 'none'}"
- Looks: "${currentDna?.looks || 'none'}"
- DominantElements: ${JSON.stringify(dominantElements.slice(0, 3))}
- Form: ${parentStructure?.form || 'determine from looks'}
- Scale: ${parentStructure?.scale || 'determine'}
- Functional type: ${parentStructure?.functionalType || 'determine from cultural_tone'}
- Opening shape: ${parentStructure?.openingShape || 'determine from looks'}`}

USER INPUT: "${userPrompt}"

${structureRules}
${perspectiveRules}

SCALE HINTS:
- small: 2-4m (pods, booths, cabins)
- medium: 4-10m (rooms, shops, cafés)
- large: 10-30m+ (halls, cathedrals, plazas)

ELEVATION RULES:
Analyze the USER INPUT to determine the vertical positioning of the space:
- ground-level: Standard ground floor or surface level (default for most spaces)
- rooftop: On top of a building (rooftop, roof terrace, helipad)
- elevated: Above ground but not a rooftop (tower room, penthouse, upper floor, observation deck, treehouse)
- underground: Below surface (basement, cellar, bunker, cave, crypt, tunnel)
- floating: Suspended in air/space (cloud platform, space station, floating island)
- suspended: Hanging structure (suspended walkway, hanging garden, cable car station)

ELEVATION CLUES from USER INPUT:
- "rooftop", "roof terrace", "on the roof" → rooftop
- "tower room", "penthouse", "observation deck", "upper floor" → elevated
- "basement", "cellar", "underground", "crypt" → underground
- Default/standard spaces → ground-level

${NAVIGABLE_ELEMENTS_RULES}

${DOMINANT_ELEMENTS_RULES}

OUTPUT (pure JSON):
{
  "name": "Space Name",
  "perspective": "${perspective || 'interior|exterior|open-air'}",
  "containerType": "building|vehicle-car|vehicle-boat|natural|tent-like",
  "structure": {
    "form": "rectangular|round|cylindrical|spherical|organic|arched|gothic|irregular",
    "roofType": "domed|flat|vaulted|pitched|arched|open-sky|null",
    "scale": "small|medium|large",
    "orientation": "vertical|horizontal|wide|cubic",
    "openings": "large-glass|arched-windows|narrow-slits|open-passages|minimal|none",
    "openingShape": "rectangular|circular|arched|mixed|irregular",
    "functionalType": "residential|commercial|religious|industrial|civic|entertainment",
    "elevation": "ground-level|rooftop|elevated|underground|floating|suspended",
    "spatialLayout": "1-2 sentence physical description",
    "requiredElements": ["user-specified elements that MUST appear"],
    "navigableElements": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["2-4 distinctive features"]
  },
  "description": "Brief space description. CRITICAL: Match perspective - if exterior/open-air, describe the EXTERIOR view; if interior, describe the INTERIOR view. Do NOT say 'interior' when perspective is exterior."
}`;
}
