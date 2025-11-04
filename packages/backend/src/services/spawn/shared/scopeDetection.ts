/**
 * Scope Detection Utilities
 * Pre-parse user prompts to determine intended host depth
 */

export type LocationScope = 'host' | 'region' | 'location';

/**
 * Detect the intended scope/depth from user prompt
 * Uses regex patterns to classify before LLM processing
 */
export function detectScope(prompt: string): LocationScope {
  const lowerPrompt = prompt.toLowerCase();

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
  // Broad areas within a host
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

  // Host-scale indicators → host
  // Large-scale entities (default case)
  const hostPatterns = [
    'metropolis', 'city', 'town', 'village',
    'realm', 'kingdom', 'empire',
    'planet', 'moon', 'station', 'habitat',
    'dimension', 'universe', 'plane'
  ];
  
  const hostRegex = new RegExp(`\\b(${hostPatterns.join('|')})\\b`, 'i');
  if (hostRegex.test(prompt)) {
    return 'host';
  }

  // Default to host for ambiguous cases
  return 'host';
}

/**
 * Post-generation guard: Strip nodes that exceed intended scope
 * Ensures LLM output doesn't exceed the pre-determined depth
 */
export function guardLocationDepth(result: any, scope: LocationScope): any {
  const guarded = { ...result };

  switch (scope) {
    case 'host':
      // Only host allowed
      delete guarded.region;
      delete guarded.location;
      break;
      
    case 'region':
      // Host + region allowed
      delete guarded.location;
      break;
      
    case 'location':
      // Host + region + location allowed
      break;
  }

  return guarded;
}
