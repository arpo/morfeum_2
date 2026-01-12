/**
 * World Location Interior Prompt
 * 
 * Combined prompt that generates Host + Region + Location (exterior) + Location (interior)
 * in a single LLM call. Used by /NEW_WORLD_LOCATION_INTERIOR command.
 * 
 * Similar to worldLocationFull.ts but adds a 4th node for the interior.
 */

import {
  DNA_SCHEMA,
  DNA_FIELD_RULES,
  DNA_DELTA_RULES,
  HOST_RULES,
  REGION_RULES,
  LOCATION_RULES,
  ATMOSPHERE_EXTRACTION
} from './shared/dnaSchema';
import type { TimeOfDay, DNA } from '../types';

/**
 * Result of the combined world location interior generation
 */
export interface WorldLocationInteriorResult {
  host: {
    id: string;
    type: 'host';
    name: string;
    slug: string;
    description: string;
    genre: string;
    weather: string;
    timeOfDay: TimeOfDay;
    spaceType: 'exterior';
    dna: DNA;
  };
  region: {
    id: string;
    type: 'region';
    name: string;
    slug: string;
    description: string;
    isPassThrough?: boolean;
    dna: DNA;
  };
  exteriorLocation: {
    id: string;
    type: 'location';
    name: string;
    slug: string;
    spaceType: 'exterior';
    description: string;
    dna: DNA;
  };
  interiorLocation: {
    id: string;
    type: 'location';
    name: string;
    slug: string;
    spaceType: 'interior';
    description: string;
    dna: DNA;
  };
}

/**
 * Build the combined prompt for generating Host + Region + Exterior Location + Interior Location
 * @param concept - User's world/interior concept description
 */
export function buildWorldLocationInteriorPrompt(concept: string): string {
  return `Output ONE valid JSON object with four nodes. No markdown, no comments.

You will analyze the user's concept and create a complete 4-layer world hierarchy:
- Host: The world/setting (city, planet, realm, era)
- Region: The district/area within host (OR pass-through if generic)
- Exterior Location: The building/structure from outside
- Interior Location: The specific interior space inside that building

The user's concept describes an INTERIOR space. You must infer the exterior building and world around it.

OUTPUT FORMAT:
{
  "host": {
    "id": "__AUTO__",
    "type": "host",
    "name": "...",
    "slug": "...",
    "description": "...",
    "genre": "...",
    "weather": "...",
    "timeOfDay": "...",
    ${DNA_SCHEMA}
  },
  "region": {
    "id": "__AUTO__",
    "type": "region",
    "name": "...",
    "slug": "...",
    "description": "...",
    "isPassThrough": false,
    ${DNA_SCHEMA}
  },
  "exteriorLocation": {
    "id": "__AUTO__",
    "type": "location",
    "name": "...",
    "slug": "...",
    "spaceType": "exterior",
    "description": "...",
    ${DNA_SCHEMA}
  },
  "interiorLocation": {
    "id": "__AUTO__",
    "type": "location",
    "name": "...",
    "slug": "...",
    "spaceType": "interior",
    "description": "...",
    ${DNA_SCHEMA}
  }
}

=== DNA STRUCTURE ===
${DNA_FIELD_RULES}

=== HOST RULES ===
${HOST_RULES}

=== REGION RULES ===
${REGION_RULES}

PASS-THROUGH REGIONS (isPassThrough: true):
Use when concept is GENERIC/UNDEFINED with no known geographic anchor:
- "A steampunk factory kitchen" → pass-through (generic, no city)
- "A medieval castle great hall" → pass-through (generic era)
Set: isPassThrough: true, name: "Region", slug: "region", description: "Pass-through region in [host name]"
DNA arrays should be empty for pass-through regions.

REAL REGIONS (isPassThrough: false):
Use when concept references a KNOWN place:
- "The kitchen of a pub in Camden in London" → region: Camden
- "Inside a hobbit hole in Middle-earth" → region: The Shire

=== EXTERIOR LOCATION RULES ===
${LOCATION_RULES}
- spaceType MUST be "exterior" - this is the OUTSIDE view of the building
- Name should be the building/structure name (e.g., "The Prancing Pony", "Castle Blackmore")
- Description describes the building from outside

=== INTERIOR LOCATION RULES ===
${LOCATION_RULES}
- spaceType MUST be "interior" - this is the INSIDE space
- Name should be the specific room/space (e.g., "Main Hall", "Kitchen", "Library")
- Description describes the interior space
- Delta DNA: Only include values that DIFFER from the exterior location
- Add interior-specific elements (furniture, interior lighting, enclosed space materials)

=== VISUAL CONSISTENCY ===
${ATMOSPHERE_EXTRACTION}

CRITICAL: Extract ALL style/mood adjectives from the concept and include them in:
1. Host dna.atmosphere (the mood terms)
2. Host dna.essence (key style terms like "whimsical design", "futuristic architecture")

Interior DNA should focus on INTERIOR-SPECIFIC elements not already in exterior.

=== CONCEPT INTERPRETATION ===
The user provides an INTERIOR concept. You must:
1. Infer what building/structure contains this interior
2. Infer what region/city/world it exists in
3. Create the full 4-layer hierarchy

Examples:
- "cozy kitchen in a pub" → pub is exterior, kitchen is interior
- "throne room of a dark castle" → castle is exterior, throne room is interior
- "engine room of a spaceship" → spaceship is exterior, engine room is interior

=== EXAMPLES ===

Input: "the kitchen of a traditional pub in Camden, London"
Output: {"host":{"id":"__AUTO__","type":"host","name":"London","slug":"london","description":"The capital city of England, known for its diverse neighborhoods and historic pubs.","genre":"Urban","weather":"overcast with light drizzle","timeOfDay":"afternoon","dna":{"essence":["British urban culture","historic city"],"formsAndMaterials":["red brick","Victorian architecture","cobblestone"],"colorAndLight":["muted grays","warm amber interiors","overcast sky"],"atmosphere":["traditional","cozy","urban"],"banned":["futuristic elements","fantasy motifs"]}},"region":{"id":"__AUTO__","type":"region","name":"Camden","slug":"camden","description":"A vibrant district in North London known for its markets, music venues, and eclectic culture.","isPassThrough":false,"dna":{"essence":["alternative culture","market district"],"formsAndMaterials":["converted warehouses","street art"],"colorAndLight":["colorful storefronts","neon signs"],"atmosphere":["bohemian","energetic"],"banned":[]}},"exteriorLocation":{"id":"__AUTO__","type":"location","name":"The Crown & Anchor","slug":"the-crown-and-anchor","spaceType":"exterior","description":"A traditional British pub with a classic facade, hanging flower baskets, and warm light spilling from the windows.","dna":{"essence":[],"formsAndMaterials":["dark wood facade","brass fixtures","hanging sign"],"colorAndLight":["warm amber glow from windows"],"atmosphere":[],"banned":[]}},"interiorLocation":{"id":"__AUTO__","type":"location","name":"The Kitchen","slug":"the-kitchen","spaceType":"interior","description":"A busy pub kitchen with copper pots hanging from the ceiling, a large cast iron stove, and shelves lined with ingredients.","dna":{"essence":[],"formsAndMaterials":["copper pots","cast iron stove","wooden shelves","tile floor"],"colorAndLight":["warm stove light","steam"],"atmosphere":["busy","aromatic"],"banned":[]}}}

Input: "a wizard's study in a magical tower"
Output: {"host":{"id":"__AUTO__","type":"host","name":"Arcanum","slug":"arcanum","description":"A mystical realm where magic permeates every aspect of existence.","genre":"Fantasy","weather":"clear with aurora","timeOfDay":"night","dna":{"essence":["magical realm","arcane energy"],"formsAndMaterials":["crystalline structures","enchanted stone","floating platforms"],"colorAndLight":["ethereal glow","aurora lights","starlight"],"atmosphere":["mystical","ancient","powerful"],"banned":["modern technology","industrial elements"]}},"region":{"id":"__AUTO__","type":"region","name":"Region","slug":"region","description":"Pass-through region in Arcanum","isPassThrough":true,"dna":{"essence":[],"formsAndMaterials":[],"colorAndLight":[],"atmosphere":[],"banned":[]}},"exteriorLocation":{"id":"__AUTO__","type":"location","name":"The Ivory Spire","slug":"the-ivory-spire","spaceType":"exterior","description":"A towering magical spire of white stone that seems to spiral impossibly into the night sky, windows glowing with arcane light.","dna":{"essence":["wizard tower"],"formsAndMaterials":["white stone","spiral architecture","glowing runes"],"colorAndLight":["arcane blue glow"],"atmosphere":[],"banned":[]}},"interiorLocation":{"id":"__AUTO__","type":"location","name":"The Study","slug":"the-study","spaceType":"interior","description":"A circular room filled with towering bookshelves, floating candles, a grand desk covered in scrolls, and a window overlooking the stars.","dna":{"essence":[],"formsAndMaterials":["leather-bound tomes","floating candles","brass telescope","crystal orbs"],"colorAndLight":["candlelight","starlight through window"],"atmosphere":["scholarly","mysterious"],"banned":[]}}}

CONCEPT: ${concept}`;
}

/**
 * Parse the combined LLM response into WorldLocationInteriorResult
 */
const VALID_TIME_OF_DAY: TimeOfDay[] = [
  'pre_dawn', 'dawn', 'morning', 'midday', 'afternoon',
  'golden_hour', 'sunset', 'dusk', 'night', 'midnight'
];

export function parseWorldLocationInteriorResponse(
  jsonString: string,
  generateId: () => string
): WorldLocationInteriorResult {
  // Clean the response - remove markdown code blocks if present
  let cleaned = jsonString.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  const parsed = JSON.parse(cleaned);
  
  // Validate host
  if (!parsed.host || parsed.host.type !== 'host') {
    throw new Error('Missing or invalid host in response');
  }
  if (!parsed.host.name || !parsed.host.slug || !parsed.host.dna) {
    throw new Error('Missing required host fields');
  }
  
  // Validate region
  if (!parsed.region || parsed.region.type !== 'region') {
    throw new Error('Missing or invalid region in response');
  }
  if (!parsed.region.name || !parsed.region.slug || !parsed.region.dna) {
    throw new Error('Missing required region fields');
  }
  
  // Validate exterior location
  if (!parsed.exteriorLocation || parsed.exteriorLocation.type !== 'location') {
    throw new Error('Missing or invalid exteriorLocation in response');
  }
  if (!parsed.exteriorLocation.name || !parsed.exteriorLocation.slug || !parsed.exteriorLocation.dna) {
    throw new Error('Missing required exteriorLocation fields');
  }
  
  // Validate interior location
  if (!parsed.interiorLocation || parsed.interiorLocation.type !== 'location') {
    throw new Error('Missing or invalid interiorLocation in response');
  }
  if (!parsed.interiorLocation.name || !parsed.interiorLocation.slug || !parsed.interiorLocation.dna) {
    throw new Error('Missing required interiorLocation fields');
  }
  
  // Validate DNA structure for all nodes
  const validateDNA = (dna: any, nodeType: string) => {
    const requiredArrays = ['essence', 'formsAndMaterials', 'colorAndLight', 'atmosphere', 'banned'];
    for (const field of requiredArrays) {
      if (!Array.isArray(dna[field])) {
        throw new Error(`${nodeType}.dna.${field} must be an array`);
      }
    }
  };
  
  validateDNA(parsed.host.dna, 'host');
  validateDNA(parsed.region.dna, 'region');
  validateDNA(parsed.exteriorLocation.dna, 'exteriorLocation');
  validateDNA(parsed.interiorLocation.dna, 'interiorLocation');
  
  // Normalize timeOfDay
  let timeOfDay: TimeOfDay = 'midday';
  if (parsed.host.timeOfDay && VALID_TIME_OF_DAY.includes(parsed.host.timeOfDay)) {
    timeOfDay = parsed.host.timeOfDay;
  }
  
  // Ensure spaceTypes are correct
  parsed.exteriorLocation.spaceType = 'exterior';
  parsed.interiorLocation.spaceType = 'interior';
  
  return {
    host: {
      ...parsed.host,
      id: generateId(),
      weather: parsed.host.weather || 'clear',
      timeOfDay,
      spaceType: 'exterior' as const
    },
    region: {
      ...parsed.region,
      id: generateId(),
      isPassThrough: parsed.region.isPassThrough || false
    },
    exteriorLocation: {
      ...parsed.exteriorLocation,
      id: generateId(),
      spaceType: 'exterior' as const
    },
    interiorLocation: {
      ...parsed.interiorLocation,
      id: generateId(),
      spaceType: 'interior' as const
    }
  };
}
