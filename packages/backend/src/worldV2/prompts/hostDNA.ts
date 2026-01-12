/**
 * Host DNA Generation Prompt
 * 
 * V2 World System - Simplified DNA structure
 * TODO: Remove when V2 is stable and old system is removed
 */

import type { TimeOfDay } from '../types';

/**
 * Build the prompt for generating a Host node with DNA
 * @param concept - User's world concept description
 */
export function buildHostDNAPrompt(concept: string): string {
  return `Output ONE valid JSON object. No markdown, no comments.

{
  "id": "__AUTO__",
  "type": "host",
  "name": "...",
  "slug": "...",
  "description": "...",
  "genre": "...",
  "weather": "...",
  "timeOfDay": "...",
  "dna": {
    "essence": ["core idea 1", "core idea 2"],
    "formsAndMaterials": ["dominant", "secondary"],
    "colorAndLight": ["palette", "light behavior"],
    "atmosphere": ["emotional tone", "experiential quality"],
    "banned": ["genre-drift visual 1", "genre-drift visual 2"]
  }
}

RULES:
- Exact keys, exact order. slug=kebab-case.
- name: If concept is a REAL PLACE (city, country, landmark), use that EXACT name. Do NOT embellish with adjectives, time periods, or modifiers. "London" stays "London", not "Victorian London Alleyway".
- genre: For real contemporary places, use NEUTRAL genres: "Urban", "Rural", "Coastal", "Suburban", "Industrial", etc. Only use stylized genres (Victorian Gothic, Steampunk, Noir, etc.) if user EXPLICITLY requests them in the concept.
- description: For real places, describe them as they exist TODAY unless user specifies otherwise. Keep it neutral and factual.
- dna: For real places, keep DNA generic and representative of the actual location. Don't impose specific styles unless requested.
- banned: Only visual motifs causing genre drift (e.g. "cyberpunk neon", "fantasy magic props"). NOT behaviors, NOT palette constraints.
- weather: Describe current weather conditions (e.g. "overcast with light drizzle", "clear and sunny", "heavy fog"). If user specifies weather, use it. Otherwise, choose something typical for the location.
- timeOfDay: MUST be one of: pre_dawn, dawn, morning, midday, afternoon, golden_hour, sunset, dusk, night, midnight. If user specifies time, use it. Otherwise, default to "midday" for neutral lighting.

CONCEPT: ${concept}`;
}

/**
 * Parse the LLM response into a Host object
 * Handles the __AUTO__ id replacement
 */
const VALID_TIME_OF_DAY: TimeOfDay[] = [
  'pre_dawn', 'dawn', 'morning', 'midday', 'afternoon',
  'golden_hour', 'sunset', 'dusk', 'night', 'midnight'
];

export function parseHostResponse(jsonString: string, generateId: () => string): {
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
} {
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
  
  // Validate required fields
  if (parsed.type !== 'host') {
    throw new Error(`Expected type "host", got "${parsed.type}"`);
  }
  
  if (!parsed.name || !parsed.slug || !parsed.description || !parsed.dna) {
    throw new Error('Missing required fields in host response');
  }
  
  // Validate DNA structure
  const dna = parsed.dna;
  const requiredArrays = ['essence', 'formsAndMaterials', 'colorAndLight', 'atmosphere', 'banned'];
  for (const field of requiredArrays) {
    if (!Array.isArray(dna[field])) {
      throw new Error(`dna.${field} must be an array`);
    }
  }
  
  // Validate and normalize timeOfDay
  let timeOfDay: TimeOfDay = 'midday'; // default
  if (parsed.timeOfDay && VALID_TIME_OF_DAY.includes(parsed.timeOfDay as TimeOfDay)) {
    timeOfDay = parsed.timeOfDay as TimeOfDay;
  }
  
  // Validate weather - use default if missing
  const weather = parsed.weather || 'clear';
  
  // Replace __AUTO__ with generated ID and add spaceType
  return {
    ...parsed,
    id: generateId(),
    weather,
    timeOfDay,
    spaceType: 'exterior' as const // Hosts are always exterior
  };
}
