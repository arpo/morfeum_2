/**
 * Naming Guidelines for Node Generation
 * 
 * Centralized instructions for generating creative, non-generic names.
 * Used across multiple prompt templates.
 */

import { blackListLocationsNames, blackListCharacterNames } from './constants';

// ==========================================
// LOCATION NAMING GUIDELINES
// ==========================================

export const LOCATION_NAMING_GUIDELINES = `
LOCATION NAMING CONVENTIONS:
1. **Creativity is Paramount**: Avoid generic names like "The [Adjective] [Noun]" (e.g., "The Enigmatic Sphere", "The Dark Forest").
2. **Cultural & Historical Depth**: Names should imply a history, culture, or function. Use proper nouns, metaphors, or compound words.
   - Bad: "The Big Market"
   - Good: "Souk of the Whispering Sands", "Neon-Kowloon", "Rustbucket Row"
3. **Avoid Clichés**: Do not use overused sci-fi/fantasy tropes unless specifically requested.
4. **Blacklist**: DO NOT use the following names or variations: ${blackListLocationsNames}
5. **Real Places**: If the user describes a real-world location, use its actual name or a recognizable variation if it's a fictionalized version.
`;

export function buildLocationNamingGuidelines(): string {
  return LOCATION_NAMING_GUIDELINES;
}

// ==========================================
// CHARACTER NAMING GUIDELINES
// ==========================================

export const CHARACTER_NAMING_GUIDELINES = `
CHARACTER NAMING CONVENTIONS:
1. **Distinctive Names**: Avoid common generic names. Names should reflect the character's origin, role, or personality.
2. **Cultural Consistency**: Ensure names fit the cultural tone of their location/world.
3. **Blacklist**: DO NOT use the following names: ${blackListCharacterNames}
`;

export function buildCharacterNamingGuidelines(): string {
  return CHARACTER_NAMING_GUIDELINES;
}

/**
 * @deprecated Use buildLocationNamingGuidelines() instead
 */
export function buildNamingGuidelines(): string {
  return LOCATION_NAMING_GUIDELINES;
}
