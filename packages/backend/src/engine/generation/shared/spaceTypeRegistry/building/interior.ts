/**
 * Building Interior - Enclosed indoor architectural space
 */

import type { SpaceTypeDefinition } from '../types';

export const BUILDING_INTERIOR: SpaceTypeDefinition = {
  id: 'building-interior',
  containerType: 'building',
  perspective: 'interior',
  description: 'Enclosed indoor architectural space',
  hasRoof: true,
  hasWalls: 'full',
  dnaGuidance: `
PERSPECTIVE: INTERIOR (Building)
- This is an enclosed indoor space (room, hall, chamber, cave, etc.)
- Focus on walls, floor, ceiling, furniture, lighting fixtures
- Describe the enclosed feeling, how light enters
- NavigableElements: doors leading to other rooms, stairs, windows with views`,
  structureGuidance: `
INTERIOR BUILDING SPACE:
- Enclosed by walls and ceiling
- Standard architectural materials (wood, stone, plaster, concrete, etc.)
- Consider functional type (residential, commercial, industrial, etc.)`,
  imageConstraints: [],
  typicalMaterials: ['wood', 'stone', 'plaster', 'concrete', 'brick', 'metal', 'glass'],
  excludeElements: [],
  imageLayerGuidance: {
    backgroundPriority: 'interior-dominant',
    backgroundDescription: 'Far interior walls, ceiling architecture, structural depth of the enclosed space. The interior surfaces and materials should dominate the background, creating depth within the room.',
    windowTreatment: 'Windows are openings IN the interior walls showing glimpses of exterior beyond. They should NOT dominate the composition - the interior materials and architecture are the main visual focus.'
  }
};
