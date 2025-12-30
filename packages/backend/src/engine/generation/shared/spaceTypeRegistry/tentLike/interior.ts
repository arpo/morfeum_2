/**
 * Tent Interior - Interior of a temporary/fabric structure
 */

import type { SpaceTypeDefinition } from '../types';

export const TENT_INTERIOR: SpaceTypeDefinition = {
  id: 'tent-interior',
  containerType: 'tent-like',
  perspective: 'interior',
  description: 'Interior of a temporary/fabric structure',
  hasRoof: true,
  hasWalls: 'partial',
  dnaGuidance: `
PERSPECTIVE: INTERIOR (Tent/Pavilion)
- This is inside a temporary or fabric structure (tent, yurt, pavilion, canopy, marquee)
- Fabric walls and/or ceiling - may be translucent allowing light through
- Focus on: fabric walls/ceiling, support poles, floor covering, interior furnishings
- Materials: canvas, fabric, rope, wooden/metal poles, rugs, cushions
- Lighting: diffused through fabric, lanterns, natural light
- NavigableElements: tent flaps/entrances, sections within tent`,
  structureGuidance: `
TENT/PAVILION INTERIOR:
- Temporary/portable structure
- Fabric walls and/or ceiling
- Support poles visible
- May be semi-transparent allowing light through
- Consider type: camping tent, yurt, circus tent, wedding marquee, military tent`,
  imageConstraints: [
    '[FABRIC STRUCTURE - Walls and/or ceiling made of fabric/canvas]',
    '[TEMPORARY: This is a tent/pavilion, not a permanent building]',
    '[MATERIALS: Canvas, fabric, rope, poles - NOT brick, concrete, glass]'
  ],
  typicalMaterials: ['canvas', 'fabric', 'rope', 'wooden poles', 'metal poles', 'rugs', 'cushions'],
  excludeElements: ['brick walls', 'glass windows', 'permanent fixtures', 'plumbing fixtures']
};
