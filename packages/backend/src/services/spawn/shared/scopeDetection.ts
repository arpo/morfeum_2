/**
 * Scope Detection Utilities
 * Pre-parse user prompts to determine intended world depth
 */

export type LocationScope = 'world' | 'region' | 'location' | 'sublocation';

/**
 * Detect the intended scope/depth from user prompt
 * Uses regex patterns to classify before LLM processing
 */
export function detectScope(prompt: string): LocationScope {
  const lowerPrompt = prompt.toLowerCase();

  // Interior indicators → sublocation
  // Phrases like "in the", "inside the", "within", etc.
  if (/\b(in the|inside the?|within the?|beneath the?|under the?)\b/i.test(prompt)) {
    return 'sublocation';
  }

  // Named place types → location
  // Specific structures/sites that are distinct entities
  const locationPatterns = [
    'dome', 'temple', 'garden', 'club', 'bar', 'pub', 'cafe',
    'market', 'bazaar', 'forest', 'station', 'monastery', 'lighthouse',
    'tower', 'bridge', 'plaza', 'square', 'park', 'museum', 'gallery',
    'harbor', 'marina', 'pier', 'dock', 'warehouse', 'factory',
    'castle', 'palace', 'mansion', 'villa', 'estate',
    'mall', 'arcade', 'alley', 'street', 'avenue', 'boulevard',
    'promenade', 'boardwalk', 'trail', 'path'
  ];
  
  const locationRegex = new RegExp(`\\b(${locationPatterns.join('|')})\\b`, 'i');
  if (locationRegex.test(prompt)) {
    return 'location';
  }

  // Geographic regions → region
  // Broad areas within a world
  const regionPatterns = [
    'district', 'quarter', 'neighborhood', 'borough',
    'shoreline', 'coastline', 'coast', 'waterfront',
    'downtown', 'uptown', 'midtown', 'old town',
    'sector', 'zone', 'area', 'region',
    'archipelago', 'islands', 'peninsula'
  ];
  
  const regionRegex = new RegExp(`\\b(${regionPatterns.join('|')})\\b`, 'i');
  if (regionRegex.test(prompt)) {
    return 'region';
  }

  // World-scale indicators → world
  // Large-scale entities (default case)
  const worldPatterns = [
    'metropolis', 'city', 'town', 'village',
    'world', 'realm', 'kingdom', 'empire',
    'planet', 'moon', 'station', 'habitat',
    'dimension', 'universe', 'plane'
  ];
  
  const worldRegex = new RegExp(`\\b(${worldPatterns.join('|')})\\b`, 'i');
  if (worldRegex.test(prompt)) {
    return 'world';
  }

  // Default to world for ambiguous cases
  return 'world';
}

/**
 * Post-generation guard: Strip nodes that exceed intended scope
 * Ensures LLM output doesn't exceed the pre-determined depth
 */
export function guardLocationDepth(result: any, scope: LocationScope): any {
  const guarded = { ...result };

  switch (scope) {
    case 'world':
      // Only world allowed
      delete guarded.region;
      delete guarded.location;
      delete guarded.sublocation;
      break;
      
    case 'region':
      // World + region allowed
      delete guarded.location;
      delete guarded.sublocation;
      break;
      
    case 'location':
      // World + region + location allowed
      delete guarded.sublocation;
      break;
      
    case 'sublocation':
      // All layers allowed
      break;
  }

  return guarded;
}
