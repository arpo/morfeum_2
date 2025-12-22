/**
 * Structure Analysis Prompt - Optimized
 * LLM prompt for analyzing physical/spatial properties of a new space
 * Runs in parallel with DNA analysis for both GO_INSIDE and GOTO commands
 * 
 * Now determines perspective (interior/exterior/open-air) when not provided
 */

import type { NavigationContext, ScenePerspective } from '../../../navigation/types';
import { 
  DOMINANT_ELEMENTS_RULES, 
  DOMINANT_ELEMENTS_EXAMPLE,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../shared/elementRules';

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
9. Do NOT use materials from "${context.currentNode.name}" - use the TARGET element's materials`
    : `STRUCTURE RULES:
1. FORM: Interior MUST match parent form (rectangular→rectangular, round→round)
2. SCALE: Interior/open-air ≤ parent scale (small parent = small space only)
3. ORIENTATION: Horizontal parent → horizontal/wide space (NEVER vertical)
4. OPENINGS: Solid exterior (dome/sphere/pod) → "none" (no windows)
5. FUNCTIONAL TYPE: Determined by cultural_tone/description, NOT appearance`;

  return `Analyze space and determine physical structure.

${perspectiveSection}

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

/**
 * Target element info extracted from dominant elements
 * Enhanced to support full interior seed data: orientation, openings, materials, atmosphere
 */
interface TargetElementInfo {
  name: string;
  fullDescription: string;
  properties: string;
  shape?: string;
  orientation?: string;
  scale?: string;
  style?: string;
  surfaces?: string;
  openings?: string;
  interiorMaterials?: {
    walls?: string;
    floor?: string;
    ceiling?: string;
  };
  enterable?: boolean;
  internalAtmosphere?: string;
}

/**
 * Find if user input references a dominant element in the current space
 * Parses dominant element strings like:
 * "alien ship: shape=organic, orientation=horizontal, scale=massive, style=futuristic, enterable=yes, internal_atmosphere=dim-mystical"
 * 
 * @param userPrompt - User's input (e.g., "alien ship" or "the ship")
 * @param dominantElements - Array of dominant element strings from current node
 * @returns TargetElementInfo if match found, null otherwise
 */
function findTargetElementInfo(userPrompt: string, dominantElements: unknown[]): TargetElementInfo | null {
  if (!dominantElements || dominantElements.length === 0) {
    return null;
  }

  const userPromptLower = userPrompt.toLowerCase();
  
  for (const element of dominantElements) {
    // Parse element format: string or structured object
    if (!element || (typeof element !== 'string' && typeof element !== 'object')) {
      continue;
    }

    let elementName = '';
    let propertiesStr = '';
    let shape: string | undefined;
    let orientation: string | undefined;
    let scale: string | undefined;
    let style: string | undefined;
    let surfaces: string | undefined;
    let openings: string | undefined;
    let interiorMaterials: { walls?: string; floor?: string; ceiling?: string } | undefined;
    let enterable: boolean | undefined;
    let internalAtmosphere: string | undefined;

    if (typeof element === 'string') {
      const colonIndex = element.indexOf(':');
      elementName = colonIndex > 0 ? element.substring(0, colonIndex).trim() : element.trim();
      propertiesStr = colonIndex > 0 ? element.substring(colonIndex + 1).trim() : '';

      // Parse all properties from the enhanced format
      const shapeMatch = propertiesStr.match(/shape=([^,]+)/i);
      const orientationMatch = propertiesStr.match(/orientation=([^,]+)/i);
      const scaleMatch = propertiesStr.match(/scale=([^,]+)/i);
      const styleMatch = propertiesStr.match(/style=([^,]+)/i);
      const surfacesMatch = propertiesStr.match(/surfaces=([^,]+)/i);
      const openingsMatch = propertiesStr.match(/openings=([^,]+)/i);
      const interiorMaterialsMatch = propertiesStr.match(/interior_materials=([^,]+)/i);
      const enterableMatch = propertiesStr.match(/enterable=([^,]+)/i);
      const atmosphereMatch = propertiesStr.match(/internal_atmosphere=([^,]+)/i);

      shape = shapeMatch ? shapeMatch[1].trim() : undefined;
      orientation = orientationMatch ? orientationMatch[1].trim() : undefined;
      scale = scaleMatch ? scaleMatch[1].trim() : undefined;
      style = styleMatch ? styleMatch[1].trim() : undefined;
      surfaces = surfacesMatch ? surfacesMatch[1].trim() : undefined;
      openings = openingsMatch ? openingsMatch[1].trim() : undefined;
      internalAtmosphere = atmosphereMatch ? atmosphereMatch[1].trim() : undefined;
      enterable = enterableMatch ? enterableMatch[1].trim().toLowerCase() === 'yes' : undefined;

      if (interiorMaterialsMatch) {
        const parts = interiorMaterialsMatch[1].trim().split('|');
        interiorMaterials = {
          walls: parts[0] || undefined,
          floor: parts[1] || undefined,
          ceiling: parts[2] || undefined
        };
      }
    } else {
      const elementObj = element as Record<string, unknown>;
      elementName = typeof elementObj.name === 'string' ? elementObj.name : '';
      shape = typeof elementObj.shape === 'string' ? elementObj.shape : undefined;
      orientation = typeof elementObj.orientation === 'string' ? elementObj.orientation : undefined;
      scale = typeof elementObj.scale === 'string' ? elementObj.scale : undefined;
      style = typeof elementObj.style === 'string' ? elementObj.style : undefined;
      surfaces = typeof elementObj.surfaces === 'string' ? elementObj.surfaces : undefined;
      openings = typeof elementObj.openings === 'string' ? elementObj.openings : undefined;

      const materialsRaw = (typeof elementObj.interior_materials === 'string'
        ? elementObj.interior_materials
        : typeof elementObj.interiorMaterials === 'string'
        ? elementObj.interiorMaterials
        : undefined) as string | undefined;
      if (materialsRaw) {
        const parts = materialsRaw.trim().split('|');
        interiorMaterials = {
          walls: parts[0] || undefined,
          floor: parts[1] || undefined,
          ceiling: parts[2] || undefined
        };
      }

      const enterableRaw = elementObj.enterable;
      if (typeof enterableRaw === 'boolean') {
        enterable = enterableRaw;
      } else if (typeof enterableRaw === 'string') {
        enterable = enterableRaw.trim().toLowerCase() === 'yes';
      }

      internalAtmosphere =
        typeof elementObj.internal_atmosphere === 'string'
          ? elementObj.internal_atmosphere
          : typeof elementObj.internalAtmosphere === 'string'
          ? elementObj.internalAtmosphere
          : undefined;

      const propertiesParts = [
        shape ? `shape=${shape}` : null,
        orientation ? `orientation=${orientation}` : null,
        scale ? `scale=${scale}` : null,
        style ? `style=${style}` : null,
        surfaces ? `surfaces=${surfaces}` : null,
        openings ? `openings=${openings}` : null,
        interiorMaterials
          ? `interior_materials=${[
              interiorMaterials.walls || '',
              interiorMaterials.floor || '',
              interiorMaterials.ceiling || ''
            ].join('|')}`
          : null,
        typeof enterable === 'boolean' ? `enterable=${enterable ? 'yes' : 'no'}` : null,
        internalAtmosphere ? `internal_atmosphere=${internalAtmosphere}` : null
      ].filter(Boolean);
      propertiesStr = propertiesParts.join(', ');
    }

    if (!elementName) {
      continue;
    }

    const elementNameLower = elementName.toLowerCase();
    
    // Check if user prompt contains the element name (or vice versa)
    // "alien ship" matches "alien ship: shape=organic..."
    // "the ship" matches "alien ship: ..."
    // "ship" matches "alien ship: ..."
    const userWords = userPromptLower.split(/\s+/);
    const elementWords = elementNameLower.split(/\s+/);
    
    const hasMatch = 
      userPromptLower.includes(elementNameLower) || 
      elementNameLower.includes(userPromptLower) ||
      elementWords.some(word => userWords.includes(word) && word.length > 3);
    
    if (hasMatch) {
      return {
        name: elementName,
        fullDescription: typeof element === 'string' ? element : JSON.stringify(element),
        properties: propertiesStr || 'determine from context',
        shape,
        orientation,
        scale,
        style,
        surfaces,
        openings,
        interiorMaterials,
        enterable,
        internalAtmosphere
      };
    }
  }
  
  return null;
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
