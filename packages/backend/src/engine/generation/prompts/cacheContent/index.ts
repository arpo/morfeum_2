/**
 * Cache Content Bundles
 * Bundles static prompt content for Gemini Explicit Caching
 * Each bundle must be ≥2,048 tokens for caching to be effective
 */

import { HIERARCHY_CATEGORIZATION_STATIC } from '../locations/hierarchyCategorization';
import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS, DNA_GUIDELINES } from '../shared/dnaSchema';
import { DOMINANT_ELEMENTS_RULES, NAVIGABLE_ELEMENTS_RULES } from '../shared/elementRules';
import { 
  HOST_COMPOSITION_INSTRUCTIONS, 
  REGION_COMPOSITION_INSTRUCTIONS, 
  EXTERIOR_COMPOSITION_INSTRUCTIONS 
} from '../locations/worldTree/compositionInstructions';

import { CHARACTER_DEEP_PROFILE_STATIC } from '../characters/characterDeepProfile';
import { CHARACTER_SEED_STATIC } from '../characters/characterSeed';
import { VISION_DESCRIPTION_STATIC } from '../shared/visionDescription';

import { STRUCTURE_ANALYSIS_STATIC } from '../navigation/structureAnalysis';
import { INTENT_CLASSIFIER_STATIC } from '../navigation/intentClassifier';
import { DESTINATION_ANALYSIS_STATIC } from '../navigation/destinationAnalysis';
import { getContainerTypeDescriptions } from '../../shared/spaceTypeRegistry';

import { DEEPEST_NODE_DNA_STATIC } from '../locations/deepestNodeDNA';
import { CHAT_IMPERSONATION_STATIC } from '../chat/chatCharacterImpersonation';
import { PARSE_HIERARCHY_STATIC } from '../../../nodeCreation/detection/parsePromptToHierarchy';

/**
 * Cache Group 1: World Creation (~6,500 tokens)
 * Used for: NEW_WORLD command, hierarchy parsing, DNA generation
 * Note: This is a LARGE cache bundle - the parseHierarchy prompt alone is ~3,000 tokens
 */
export const CACHE_WORLD_CREATION = `
=== MORFEUM WORLD CREATION SYSTEM ===

=== PARSE PROMPT TO HIERARCHY ===

${PARSE_HIERARCHY_STATIC}

=== HIERARCHY CATEGORIZATION (LEGACY) ===

${HIERARCHY_CATEGORIZATION_STATIC}

=== DNA SCHEMA ===

Scene Fields:
${Object.entries(DNA_SCENE_FIELDS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Cascading Fields:
${Object.entries(DNA_CASCADING_FIELDS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Guidelines:
${Object.values(DNA_GUIDELINES).join('\n')}

=== ELEMENT RULES ===

${DOMINANT_ELEMENTS_RULES}

${NAVIGABLE_ELEMENTS_RULES}

=== DNA GENERATION ===

${DEEPEST_NODE_DNA_STATIC}
`;

/**
 * Cache Group 2: Character Creation (~3,800 tokens)
 * Used for: Character spawn, profile generation, image analysis
 */
export const CACHE_CHARACTER_CREATION = `
=== MORFEUM CHARACTER SYSTEM ===

${CHARACTER_DEEP_PROFILE_STATIC}

=== CHARACTER SEED GENERATION ===

${CHARACTER_SEED_STATIC}

=== IMAGE ANALYSIS ===

${VISION_DESCRIPTION_STATIC}
`;

/**
 * Cache Group 3: Navigation (~3,200 tokens)
 * Used for: GOTO, GO_INSIDE commands, structure analysis
 * IMPORTANT: Must be ≥2,048 tokens for Gemini caching to work
 */
export const CACHE_NAVIGATION = `
=== MORFEUM NAVIGATION SYSTEM ===

${STRUCTURE_ANALYSIS_STATIC}

=== INTENT CLASSIFICATION ===

${INTENT_CLASSIFIER_STATIC}

=== DESTINATION ANALYSIS ===

${DESTINATION_ANALYSIS_STATIC}

=== CONTAINER TYPES ===

${getContainerTypeDescriptions()}

=== ELEMENT RULES FOR NAVIGATION ===

${DOMINANT_ELEMENTS_RULES}

${NAVIGABLE_ELEMENTS_RULES}

=== NAVIGATION COMMAND REFERENCE ===

GOTO Command:
- Creates a NEW location node as sibling or child
- User specifies destination by name or description
- System analyzes destination and determines perspective (interior/exterior/open-air)
- Examples: "goto the castle", "goto a cozy cafe", "goto the garden"

GO_INSIDE Command:
- Enters an EXISTING dominant element from current location
- Creates interior niche within the element
- Must target an enterable structure (building, vehicle, container)
- Examples: "go inside the tower", "enter the car", "step into the tent"

PERSPECTIVE RULES:
- INTERIOR: Enclosed space with roof/ceiling (rooms, cabins, caves)
  - roofType: domed, flat, vaulted, pitched, arched
  - openings: windows, doors, passages
  
- EXTERIOR: Open outdoor space (parks, plazas, streets, building facades)
  - roofType: open-sky
  - Shows outside view of structures
  
- OPEN-AIR: Semi-enclosed with open sky (balconies, terraces, rooftops, decks)
  - roofType: open-sky
  - May have partial walls/railings

SCALE HIERARCHY:
- small: 2-4 meters (closet, bathroom, car interior)
- medium: 4-10 meters (room, office, small shop)
- large: 10-30+ meters (hall, warehouse, plaza)

ELEVATION TYPES:
- ground-level: Default street/floor level
- rooftop: On top of building
- elevated: Upper floors, towers, penthouses
- underground: Basements, cellars, crypts
- floating: Airborne, suspended in air
- suspended: Hanging from structure

FORM TYPES:
- rectangular: Standard box shape
- round: Circular floor plan
- cylindrical: Vertical cylinder (tower)
- spherical: Dome or ball
- organic: Irregular natural shape
- arched: Gothic or curved
- irregular: Non-standard shape

FUNCTIONAL TYPES:
- residential: Homes, apartments, bedrooms
- commercial: Shops, restaurants, offices
- religious: Churches, temples, shrines
- industrial: Factories, warehouses, workshops
- civic: Museums, libraries, stations
- entertainment: Bars, theaters, arenas
- natural: Outdoor natural spaces
`;

/**
 * Cache Group 4: Chat/Impersonation (~1,100 tokens)
 * Used for: Character chat, role-play conversations
 */
export const CACHE_CHAT = `
=== MORFEUM CHAT SYSTEM ===

${CHAT_IMPERSONATION_STATIC}
`;

/**
 * Cache group identifiers
 */
export type CacheGroupId = 
  | 'morfeum-world-creation'
  | 'morfeum-character-creation'
  | 'morfeum-navigation'
  | 'morfeum-chat';

/**
 * Map of cache group IDs to their static content
 */
export const CACHE_GROUPS: Record<CacheGroupId, string> = {
  'morfeum-world-creation': CACHE_WORLD_CREATION,
  'morfeum-character-creation': CACHE_CHARACTER_CREATION,
  'morfeum-navigation': CACHE_NAVIGATION,
  'morfeum-chat': CACHE_CHAT
};

/**
 * Get estimated token count for a cache group
 * Rough estimate: ~4 chars per token
 */
export function estimateCacheTokens(groupId: CacheGroupId): number {
  const content = CACHE_GROUPS[groupId];
  return Math.ceil(content.length / 4);
}
