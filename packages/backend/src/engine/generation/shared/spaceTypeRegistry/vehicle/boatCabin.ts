/**
 * Vehicle Boat Cabin - Interior cabin of a watercraft
 */

import type { SpaceTypeDefinition } from '../types';

export const VEHICLE_BOAT_CABIN: SpaceTypeDefinition = {
  id: 'vehicle-boat-cabin',
  containerType: 'vehicle-boat',
  perspective: 'interior',
  description: 'Interior cabin of a watercraft',
  hasRoof: true,
  hasWalls: 'full',
  dnaGuidance: `
PERSPECTIVE: INTERIOR (Vehicle - Boat Cabin)
- This is an interior cabin of a watercraft (ship, yacht, boat, submarine)
- NAUTICAL space - compact, efficient, marine-grade materials
- Focus on: bunks/berths, galley, navigation equipment, portholes, marine fixtures
- Materials: teak wood, brass fittings, marine-grade fabrics, fiberglass
- Lighting: porthole light, marine lamps, instrument glow
- Curved walls following hull shape, compact efficient layout
- NavigableElements: companionway stairs, hatches, doors to other cabins, deck access`,
  structureGuidance: `
BOAT/SHIP CABIN:
- Compact nautical interior - follows hull shape
- scale typically "small" to "medium"
- Marine materials: teak, brass, stainless steel, marine fabric
- Portholes for windows (circular or oval)
- Efficient space usage, built-in furniture
- Consider vessel type: yacht, sailboat, fishing boat, cruise ship, submarine`,
  imageConstraints: [
    '[CRITICAL: NAUTICAL INTERIOR - This is a BOAT/SHIP cabin, NOT a building room]',
    '[SHAPE: Walls may curve following hull shape - not rectangular like buildings]',
    '[MATERIALS: Marine only - teak, brass, stainless steel, marine fabrics, fiberglass]',
    '[WINDOWS: Portholes (circular/oval) - NOT rectangular building windows]',
    '[DO NOT SHOW: Building materials, rectangular windows, non-marine fixtures]'
  ],
  typicalMaterials: ['teak wood', 'brass', 'stainless steel', 'marine fabric', 'fiberglass', 'rope', 'canvas'],
  excludeElements: ['brick', 'plaster', 'rectangular windows', 'wood floors (non-marine)', 'building fixtures'],
  imageLayerGuidance: {
    backgroundPriority: 'interior-dominant',
    backgroundDescription: 'Far cabin walls following hull curve, nautical fixtures, built-in storage and furniture. The enclosed marine interior dominates the background.',
    windowTreatment: 'Portholes (circular/oval openings) show glimpses of water or sky. They are small accent elements, NOT the main visual focus.'
  }
};
