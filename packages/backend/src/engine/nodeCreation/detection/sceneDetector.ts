/**
 * Scene Detector
 * 
 * Detects whether a scene description is interior, exterior, or transitional.
 * Used to determine camera style and composition for image generation.
 */

import type { ScenePerspective, CameraStyle, NodeType, SceneAnalysis } from '../types';

/**
 * Keywords that indicate interior scenes
 */
const INTERIOR_KEYWORDS = [
  'inside', 'interior', 'room', 'hall', 'chamber', 'within', 'indoor',
  'lobby', 'corridor', 'passage', 'vault', 'cellar', 'basement', 'attic',
  'kitchen', 'bathroom', 'bedroom', 'living room', 'dining room', 'office',
  'library', 'study', 'parlor', 'lounge', 'bar', 'pub', 'restaurant',
  'cave', 'cavern', 'tunnel', 'bunker', 'shelter', 'warehouse',
  'factory floor', 'workshop', 'studio', 'gallery', 'museum',
  'church interior', 'temple interior', 'sanctuary', 'nave', 'chapel',
  'throne room', 'great hall', 'banquet hall', 'ballroom',
];

/**
 * Keywords that indicate exterior scenes
 */
const EXTERIOR_KEYWORDS = [
  'outside', 'exterior', 'outdoor', 'street', 'road', 'path', 'trail',
  'garden', 'park', 'plaza', 'square', 'courtyard', 'terrace', 'balcony',
  'rooftop', 'deck', 'patio', 'porch', 'veranda',
  'forest', 'woods', 'jungle', 'desert', 'beach', 'coast', 'shore',
  'mountain', 'hill', 'valley', 'canyon', 'cliff', 'peak', 'summit',
  'field', 'meadow', 'prairie', 'plain', 'savanna',
  'river', 'lake', 'ocean', 'sea', 'pond', 'waterfall', 'stream',
  'city', 'town', 'village', 'skyline', 'cityscape', 'landscape',
  'facade', 'entrance', 'doorway', 'gateway', 'archway',
  'marketplace', 'bazaar', 'harbor', 'port', 'dock', 'pier',
];

/**
 * Keywords that indicate transitional spaces (doorways, passages, etc.)
 */
const TRANSITIONAL_KEYWORDS = [
  'doorway', 'threshold', 'entrance', 'exit', 'gateway', 'portal',
  'passage', 'corridor', 'hallway', 'stairway', 'staircase',
  'bridge', 'walkway', 'overpass', 'underpass',
  'between', 'transitioning', 'crossing',
];

/**
 * Structure keywords that suggest specific node types
 */
const STRUCTURE_KEYWORDS: Record<string, NodeType> = {
  // Host-level (worlds, settings)
  'world': 'host',
  'realm': 'host',
  'kingdom': 'host',
  'empire': 'host',
  'planet': 'host',
  'dimension': 'host',
  'universe': 'host',
  'metropolis': 'host',
  'city': 'host',
  'land': 'host',
  
  // Region-level (districts, biomes)
  'district': 'region',
  'quarter': 'region',
  'sector': 'region',
  'zone': 'region',
  'area': 'region',
  'neighborhood': 'region',
  'biome': 'region',
  'forest': 'region',
  'desert': 'region',
  'mountains': 'region',
  
  // Location-level (buildings, sites)
  'building': 'location',
  'tower': 'location',
  'castle': 'location',
  'fortress': 'location',
  'temple': 'location',
  'church': 'location',
  'pub': 'location',
  'bar': 'location',
  'restaurant': 'location',
  'shop': 'location',
  'store': 'location',
  'house': 'location',
  'mansion': 'location',
  'palace': 'location',
  'lighthouse': 'location',
  'observatory': 'location',
  'factory': 'location',
  'warehouse': 'location',
  'station': 'location',
  'terminal': 'location',
  
  // Niche-level (spaces within)
  'room': 'niche',
  'chamber': 'niche',
  'hall': 'niche',
  'lounge': 'niche',
  'office': 'niche',
  'bedroom': 'niche',
  'kitchen': 'niche',
  'bathroom': 'niche',
  'cellar': 'niche',
  'attic': 'niche',
  'balcony': 'niche',
  'terrace': 'niche',
  'rooftop': 'niche',
  'garden': 'niche',
  'courtyard': 'niche',
};

/**
 * Detect the scene type from a description
 * 
 * @param description - The scene description to analyze
 * @returns Scene perspective (interior, exterior, or transitional)
 */
export function detectSceneType(description: string): ScenePerspective {
  const lowerDesc = description.toLowerCase();
  
  // Count matches for each type
  let interiorScore = 0;
  let exteriorScore = 0;
  let transitionalScore = 0;
  
  // Check interior keywords
  for (const keyword of INTERIOR_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      interiorScore++;
    }
  }
  
  // Check exterior keywords
  for (const keyword of EXTERIOR_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      exteriorScore++;
    }
  }
  
  // Check transitional keywords
  for (const keyword of TRANSITIONAL_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      transitionalScore++;
    }
  }
  
  // Special case: "inside X" is always interior
  if (lowerDesc.match(/\binside\b/)) {
    interiorScore += 5;
  }
  
  // Special case: "outside X" is always exterior
  if (lowerDesc.match(/\boutside\b/)) {
    exteriorScore += 5;
  }
  
  // Determine winner
  if (transitionalScore > 0 && transitionalScore >= interiorScore && transitionalScore >= exteriorScore) {
    return 'open-air';
  }
  
  if (interiorScore > exteriorScore) {
    return 'interior';
  }
  
  if (exteriorScore > interiorScore) {
    return 'exterior';
  }
  
  // Default to exterior (most common for establishing shots)
  return 'exterior';
}

/**
 * Suggest a node type based on the description
 * 
 * @param description - The description to analyze
 * @returns Suggested node type
 */
export function suggestNodeType(description: string): NodeType {
  const lowerDesc = description.toLowerCase();
  
  // Check for structure keywords
  for (const [keyword, nodeType] of Object.entries(STRUCTURE_KEYWORDS)) {
    if (lowerDesc.includes(keyword)) {
      return nodeType;
    }
  }
  
  // Default to location (most common)
  return 'location';
}

/**
 * Get camera style based on node type and perspective
 * 
 * @param nodeType - The type of node
 * @param perspective - Interior, exterior, or transitional
 * @returns Appropriate camera style
 */
export function getCameraStyle(nodeType: NodeType, perspective: ScenePerspective): CameraStyle {
  switch (nodeType) {
    case 'host':
      return 'establishing'; // Wide, epic establishing shot
    case 'region':
      return 'aerial'; // Aerial or high-angle overview
    case 'location':
      return 'ground'; // Ground level, building in focus
    case 'niche':
      return perspective === 'interior' ? 'intimate' : 'ground';
    default:
      return 'ground';
  }
}

/**
 * Check if description contains explicit elements (e.g., "with stairs and machine")
 * 
 * @param description - The description to check
 * @returns Whether explicit elements are mentioned
 */
export function hasExplicitElements(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  
  // Pattern: "with X" or "containing X" or "featuring X"
  const patterns = [
    /\bwith\s+\w+/,
    /\bcontaining\s+\w+/,
    /\bfeaturing\s+\w+/,
    /\bincluding\s+\w+/,
    /\bhas\s+\w+/,
  ];
  
  return patterns.some(pattern => pattern.test(lowerDesc));
}

/**
 * Perform full scene analysis
 * 
 * @param description - The description to analyze
 * @returns Complete scene analysis
 */
export function analyzeScene(description: string): SceneAnalysis {
  const sceneType = detectSceneType(description);
  const suggestedDepth = suggestNodeType(description);
  const cameraStyle = getCameraStyle(suggestedDepth, sceneType);
  const hasElements = hasExplicitElements(description);
  
  // Calculate confidence based on keyword matches
  const lowerDesc = description.toLowerCase();
  let keywordMatches = 0;
  
  for (const keyword of [...INTERIOR_KEYWORDS, ...EXTERIOR_KEYWORDS]) {
    if (lowerDesc.includes(keyword)) {
      keywordMatches++;
    }
  }
  
  // More matches = higher confidence
  const confidence = Math.min(0.9, 0.3 + (keywordMatches * 0.1));
  
  return {
    sceneType,
    suggestedDepth,
    cameraStyle,
    hasExplicitElements: hasElements,
    confidence,
  };
}
