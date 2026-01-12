/**
 * World Location Full Prompt
 * 
 * Combined prompt that generates Host + Region + Location in a single LLM call
 * Used by /NEW_WORLD_LOCATION command for better performance and consistency
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
import type { TimeOfDay, Host, Region } from '../types';

/**
 * Result of the combined world location generation
 */
export interface WorldLocationFullResult {
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
    dna: {
      essence: string[];
      formsAndMaterials: string[];
      colorAndLight: string[];
      atmosphere: string[];
      banned: string[];
    };
  };
  region: {
    id: string;
    type: 'region';
    name: string;
    slug: string;
    description: string;
    isPassThrough?: boolean;
    dna: {
      essence: string[];
      formsAndMaterials: string[];
      colorAndLight: string[];
      atmosphere: string[];
      banned: string[];
    };
  };
  location: {
    id: string;
    type: 'location';
    name: string;
    slug: string;
    spaceType: 'exterior' | 'interior';
    description: string;
    dna: {
      essence: string[];
      formsAndMaterials: string[];
      colorAndLight: string[];
      atmosphere: string[];
      banned: string[];
    };
  };
}

/**
 * Build the combined prompt for generating Host + Region + Location in one call
 * @param concept - User's world concept description
 */
export function buildWorldLocationFullPrompt(concept: string): string {
  return `Output ONE valid JSON object with three nodes. No markdown, no comments.

You will analyze the user's concept and create a complete 3-layer world hierarchy:
- Host: The world/setting (city, planet, realm, era)
- Region: The district/area within host (OR pass-through if generic)
- Location: The specific place (building, structure, site)

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
  "location": {
    "id": "__AUTO__",
    "type": "location",
    "name": "...",
    "slug": "...",
    "spaceType": "exterior",
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
- "A steampunk factory" → pass-through (generic, no city)
- "A medieval castle" → pass-through (generic era)
- "An alien building on a distant planet" → pass-through
Set: isPassThrough: true, name: "Region", slug: "region", description: "Pass-through region in [host name]"
DNA arrays should be empty for pass-through regions.

REAL REGIONS (isPassThrough: false):
Use when concept references a KNOWN place:
- "A pub in Camden in London" → region: Camden
- "A hobbit hole in Middle-earth" → region: The Shire

=== LOCATION RULES ===
${LOCATION_RULES}

=== VISUAL CONSISTENCY ===
${ATMOSPHERE_EXTRACTION}

CRITICAL: Extract ALL style/mood adjectives from the concept and include them in:
1. Host dna.atmosphere (the mood terms)
2. Host dna.essence (key style terms like "whimsical design", "futuristic architecture")

This ensures all child nodes inherit the visual style. The location DNA should only contain DELTA values that differ from the host.

=== NON-LOCATION CONCEPTS ===
If input describes something OTHER than a location (character, object, abstract scene), create a suitable location that fits:
- "A wizard with a long beard" → Location: wizard's study or magical tower
- "A cyberpunk hacker" → Location: neon-lit apartment
Always return valid host/region/location - NEVER fail.

=== EXAMPLES ===

Input: "a pub in Camden in London"
Output: {"host":{"id":"__AUTO__","type":"host","name":"London","slug":"london","description":"The capital city of England, known for its diverse neighborhoods and historic pubs.","genre":"Urban","weather":"overcast with light drizzle","timeOfDay":"afternoon","dna":{"essence":["British urban culture","historic city"],"formsAndMaterials":["red brick","Victorian architecture","cobblestone"],"colorAndLight":["muted grays","warm amber interiors","overcast sky"],"atmosphere":["traditional","cozy","urban"],"banned":["futuristic elements","fantasy motifs"]}},"region":{"id":"__AUTO__","type":"region","name":"Camden","slug":"camden","description":"A vibrant district in North London known for its markets, music venues, and eclectic culture.","isPassThrough":false,"dna":{"essence":["alternative culture","market district"],"formsAndMaterials":["converted warehouses","street art"],"colorAndLight":["colorful storefronts","neon signs"],"atmosphere":["bohemian","energetic"],"banned":[]}},"location":{"id":"__AUTO__","type":"location","name":"The Pub","slug":"the-pub","spaceType":"exterior","description":"A traditional British pub with warm lighting and dark wood interior.","dna":{"essence":[],"formsAndMaterials":["dark wood bar","brass fixtures"],"colorAndLight":["warm amber glow"],"atmosphere":[],"banned":[]}}}

Input: "A whimsical, multi-tiered white structure over sandy desert with pink moon"
Output: {"host":{"id":"__AUTO__","type":"host","name":"Xylos","slug":"xylos","description":"A surreal alien desert world with deep blue skies and a pink celestial body.","genre":"Sci-Fi","weather":"clear","timeOfDay":"midday","dna":{"essence":["alien ecosystem","whimsical design","surreal landscapes","futuristic architecture"],"formsAndMaterials":["crystalline structures","organic architecture","smooth stone"],"colorAndLight":["sandy orange-brown","deep blue sky","pink celestial body","white","vibrant colors"],"atmosphere":["whimsical","fantastical","surreal","otherworldly"],"banned":["traditional alien tropes","industrial elements"]}},"region":{"id":"__AUTO__","type":"region","name":"Region","slug":"region","description":"Pass-through region in Xylos","isPassThrough":true,"dna":{"essence":[],"formsAndMaterials":[],"colorAndLight":[],"atmosphere":[],"banned":[]}},"location":{"id":"__AUTO__","type":"location","name":"Xylos Orbital Hub","slug":"xylos-orbital-hub","spaceType":"exterior","description":"A magnificent, multi-tiered white structure with ornate geometric windows and colorful spires, floating over the desert landscape.","dna":{"essence":["floating architecture"],"formsAndMaterials":["multi-tiered structure","geometric windows","ornate spires","dangling ornaments"],"colorAndLight":["glowing accents"],"atmosphere":[],"banned":[]}}}

CONCEPT: ${concept}`;
}

/**
 * Parse the combined LLM response into WorldLocationFullResult
 */
const VALID_TIME_OF_DAY: TimeOfDay[] = [
  'pre_dawn', 'dawn', 'morning', 'midday', 'afternoon',
  'golden_hour', 'sunset', 'dusk', 'night', 'midnight'
];

export function parseWorldLocationFullResponse(
  jsonString: string,
  generateId: () => string
): WorldLocationFullResult {
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
  
  // Validate location
  if (!parsed.location || parsed.location.type !== 'location') {
    throw new Error('Missing or invalid location in response');
  }
  if (!parsed.location.name || !parsed.location.slug || !parsed.location.dna) {
    throw new Error('Missing required location fields');
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
  validateDNA(parsed.location.dna, 'location');
  
  // Normalize timeOfDay
  let timeOfDay: TimeOfDay = 'midday';
  if (parsed.host.timeOfDay && VALID_TIME_OF_DAY.includes(parsed.host.timeOfDay)) {
    timeOfDay = parsed.host.timeOfDay;
  }
  
  // Normalize spaceType
  if (parsed.location.spaceType !== 'exterior' && parsed.location.spaceType !== 'interior') {
    parsed.location.spaceType = 'exterior';
  }
  
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
    location: {
      ...parsed.location,
      id: generateId()
    }
  };
}
