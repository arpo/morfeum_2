/**
 * Vehicle Boat Deck - Open deck of a watercraft
 */

import type { SpaceTypeDefinition } from '../types';

export const VEHICLE_BOAT_DECK: SpaceTypeDefinition = {
  id: 'vehicle-boat-deck',
  containerType: 'vehicle-boat',
  perspective: 'open-air',
  description: 'Open deck of a watercraft',
  hasRoof: false,
  hasWalls: 'partial',
  dnaGuidance: `
PERSPECTIVE: OPEN-AIR (Vehicle - Boat Deck)
- This is an open deck of a watercraft (ship deck, yacht deck, boat deck)
- NAUTICAL outdoor space - open to sky with water/ocean views
- Focus on: deck planking, railings, marine equipment, views of water and sky
- Materials: teak decking, rope, metal railings, canvas, nautical hardware
- Partial cover may exist (bimini, awning) but sky is visible
- NavigableElements: stairs to other decks, cabin entrances, gangways, bow/stern access`,
  structureGuidance: `
BOAT/SHIP DECK:
- Open-air nautical space
- roofType MUST be "open-sky" (may have partial bimini/awning)
- Marine deck materials: teak planking, non-slip surfaces
- Railings and safety equipment visible
- Water/ocean visible around, sky above
- Consider vessel type: yacht, sailboat, cruise ship, fishing boat`,
  imageConstraints: [
    '[CRITICAL: NAUTICAL DECK - This is a BOAT/SHIP deck, NOT a building terrace]',
    '[ENVIRONMENT: Water/ocean visible around, open sky above]',
    '[MATERIALS: Marine deck - teak planking, metal railings, nautical hardware]',
    '[DO NOT SHOW: Building architecture, land-based elements, non-marine fixtures]'
  ],
  typicalMaterials: ['teak decking', 'rope', 'stainless steel railings', 'canvas', 'nautical hardware', 'non-slip surfaces'],
  excludeElements: ['building architecture', 'land plants', 'building railings', 'concrete', 'asphalt'],
  imageLayerGuidance: {
    backgroundPriority: 'exterior-dominant',
    backgroundDescription: 'Ocean horizon, sky, water surrounding the vessel. The maritime environment dominates the background with expansive views of sea and sky.',
    windowTreatment: 'No windows - this is an open deck. Railings frame the ocean view but do not obstruct it.'
  }
};
