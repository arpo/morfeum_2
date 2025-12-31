/**
 * Structure Analysis Prompt - Optimized
 * LLM prompt for analyzing physical/spatial properties of a new space
 * For both GO_INSIDE and GOTO commands
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
  perspective?: ScenePerspective | null;
  navigableElements?: Array<{ type: string; position: string; description: string }>;
  furnishing?: string[];
  isGotoCommand?: boolean;
}

// Shared constants to avoid duplication
const SCALE_HINTS = `SCALE: small(2-4m)|medium(4-10m)|large(10-30m+)`;

const ELEVATION_RULES = `ELEVATION: ground-level|rooftop|elevated|underground|floating|suspended
- rooftop: "roof terrace", "on the roof"
- elevated: "tower room", "penthouse", "upper floor"
- underground: "basement", "cellar", "crypt"
- Default: ground-level`;

const PERSPECTIVE_RULES = `PERSPECTIVE:
- INTERIOR: enclosed with roof (room, hall, cave, vehicle interior) → roofType=domed/flat/vaulted
- EXTERIOR: open outdoor (park, plaza, garden, street) → roofType=open-sky, no ceiling
- OPEN-AIR: semi-enclosed, open sky (balcony, terrace, rooftop) → roofType=open-sky`;

/**
 * Static content for caching (~1,200 tokens)
 * Contains scale hints, elevation rules, perspective rules, and output templates
 */
export const STRUCTURE_ANALYSIS_STATIC = `Analyze space structure.

${SCALE_HINTS}
${ELEVATION_RULES}

${PERSPECTIVE_RULES}

${NAVIGABLE_ELEMENTS_RULES}

${DOMINANT_ELEMENTS_RULES}

OUTPUT TEMPLATE (pure JSON):
{
  "name": "Space Name",
  "perspective": "interior|exterior|open-air",
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
    "spatialLayout": "1-2 sentence description",
    "requiredElements": ["user-specified elements"],
    "navigableElements": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["2-4 distinctive features"]
  },
  "description": "Brief description matching perspective"
}`;

export function structureAnalysisPrompt(input: StructureAnalysisInput): string {
  const { userPrompt, context, perspective, isGotoCommand } = input;

  const currentDna = context.currentNode.dna as any;
  const currentNodeData = context.currentNode.data as any;
  const parentStructure = currentNodeData?.structure || currentDna?.structure;
  
  const perspectiveSection = perspective 
    ? `PERSPECTIVE: ${perspective.toUpperCase()} (provided)`
    : PERSPECTIVE_RULES;

  const containerTypeSection = `CONTAINER TYPE:\n${getContainerTypeDescriptions()}
Default: "building" unless clearly vehicle/natural/tent`;

  // ═══════════════════════════════════════════════════════════════════════════
  // GOTO COMMAND
  // ═══════════════════════════════════════════════════════════════════════════
  if (isGotoCommand) {
    return `Create NEW LOCATION from user's destination.

${perspectiveSection}

${containerTypeSection}

USER INPUT (destination): "${userPrompt}"

STYLE CONTEXT:
- Style: "${currentDna?.architectural_tone || currentDna?.genre || 'default'}"
- Palette: "${currentDna?.palette_bias || 'from destination'}"

NAMING: Extract from USER INPUT ("to the park" → "The Park")

${SCALE_HINTS}
${ELEVATION_RULES}

${NAVIGABLE_ELEMENTS_RULES}

${DOMINANT_ELEMENTS_RULES}

OUTPUT (pure JSON):
{
  "name": "Destination Name",
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
    "spatialLayout": "1-2 sentence description",
    "requiredElements": ["elements from USER INPUT"],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["distinctive features"]
  },
  "description": "Brief description matching perspective"
}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GO_INSIDE COMMAND
  // ═══════════════════════════════════════════════════════════════════════════
  
  const dominantElements = currentNodeData?.dominantElements || [];
  const targetElementInfo = findTargetElementInfo(userPrompt, dominantElements);
  
  // Build structure rules based on target element or parent
  let structureRules: string;
  let contextSection: string;
  
  if (targetElementInfo) {
    structureRules = `ENTERING "${targetElementInfo.name}" WITHIN "${context.currentNode.name}".
Creating INTERIOR of "${targetElementInfo.name}", NOT another "${context.currentNode.name}".

TARGET ELEMENT: ${targetElementInfo.properties}
- Shape: ${targetElementInfo.shape || 'from element'}
- Orientation: ${targetElementInfo.orientation || 'from element'}
- Scale: ${targetElementInfo.scale || 'element size'}
- Openings: ${targetElementInfo.openings || 'element style'}
- Atmosphere: ${targetElementInfo.internalAtmosphere || 'element style'}
${targetElementInfo.interiorMaterials ? `- Interior: walls=${targetElementInfo.interiorMaterials.walls}, floor=${targetElementInfo.interiorMaterials.floor}, ceiling=${targetElementInfo.interiorMaterials.ceiling}` : ''}

dominantElements = OBJECTS/FURNITURE inside (NOT "${targetElementInfo.name}")`;
    
    contextSection = `ENTERING: "${targetElementInfo.name}" inside "${context.currentNode.name}"
TARGET: ${targetElementInfo.fullDescription}`;
  } else {
    structureRules = `STRUCTURE RULES:
- FORM: Match parent (rectangular→rectangular, round→round)
- SCALE: ≤ parent scale
- ORIENTATION: Match parent (horizontal→horizontal, NOT vertical)
- OPENINGS: Solid exterior → "none"`;
    
    contextSection = `CURRENT: "${context.currentNode.name}" (${context.currentNode.type})
${context.parentNode ? `PARENT: "${context.parentNode.name}" (${context.parentNode.type})` : ''}
- Description: "${context.currentNode.data?.description || 'none'}"
- Cultural: "${currentDna?.cultural_tone || 'none'}"
- DominantElements: ${JSON.stringify(dominantElements.slice(0, 3))}
- Form: ${parentStructure?.form || 'determine'}
- Scale: ${parentStructure?.scale || 'determine'}`;
  }

  return `Analyze space structure.

${perspectiveSection}

${containerTypeSection}

${contextSection}

USER INPUT: "${userPrompt}"

${structureRules}

${SCALE_HINTS}
${ELEVATION_RULES}

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
    "spatialLayout": "1-2 sentence description",
    "requiredElements": ["user-specified elements"],
    "navigableElements": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
    "dominantElements": [${DOMINANT_ELEMENTS_EXAMPLE}],
    "uniqueIdentifiers": ["2-4 distinctive features"]
  },
  "description": "Brief description matching perspective"
}`;
}
