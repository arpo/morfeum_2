/**
 * Building Open-Air - Semi-enclosed space with open sky
 */

import type { SpaceTypeDefinition } from '../types';

export const BUILDING_OPEN_AIR: SpaceTypeDefinition = {
  id: 'building-open-air',
  containerType: 'building',
  perspective: 'open-air',
  description: 'Semi-enclosed space with open sky',
  hasRoof: false,
  hasWalls: 'partial',
  dnaGuidance: `
PERSPECTIVE: OPEN-AIR
- This is a semi-enclosed space with open sky (balcony, terrace, rooftop, covered patio, pergola)
- Has partial walls/railings but NO ceiling - sky is directly visible above
- Focus on the view, railing/edge details, relationship to building AND sky/weather
- Describe the blend of shelter and exposure - protected from some elements but open to sky
- NavigableElements: doors back inside, stairs to other levels, overlook points`,
  structureGuidance: `
OPEN-AIR BUILDING SPACE:
- Partial walls or railings (not fully enclosed)
- roofType MUST be "open-sky"
- Connected to a building but exposed to sky
- May have pergola, awning, or partial cover but sky visible`,
  imageConstraints: [
    '[CRITICAL: OPEN-SKY - No solid roof/ceiling. The sky is directly visible above. May have partial cover (pergola, awning) but sky shows through.]'
  ],
  typicalMaterials: ['architectural railings', 'outdoor flooring', 'weather-resistant materials'],
  excludeElements: ['solid ceiling', 'fully enclosed walls']
};
