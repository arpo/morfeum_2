/**
 * Natural Clearing - Natural outdoor formation
 */

import type { SpaceTypeDefinition } from '../types';

export const NATURAL_CLEARING: SpaceTypeDefinition = {
  id: 'natural-clearing',
  containerType: 'natural',
  perspective: 'exterior',
  description: 'Natural outdoor formation',
  hasRoof: false,
  hasWalls: 'none',
  dnaGuidance: `
PERSPECTIVE: EXTERIOR (Natural)
- This is a natural outdoor space (forest clearing, grove, meadow, beach)
- Entirely natural - no man-made structures
- Focus on: vegetation, terrain, natural features, wildlife signs, sky
- Materials: earth, grass, leaves, rocks, sand, water
- NavigableElements: paths, trails, natural passages, water crossings`,
  structureGuidance: `
NATURAL OUTDOOR SPACE:
- No artificial structures
- roofType MUST be "open-sky" (canopy from trees is natural, not a roof)
- Natural terrain and vegetation
- Consider biome: forest, meadow, beach, mountain, etc.`,
  imageConstraints: [
    '[NATURAL ENVIRONMENT - No man-made structures unless specified]',
    '[OPEN-SKY - Natural sky visible (may be filtered through tree canopy)]'
  ],
  typicalMaterials: ['earth', 'grass', 'leaves', 'rocks', 'sand', 'bark', 'moss'],
  excludeElements: ['buildings', 'paved surfaces', 'man-made structures']
};
