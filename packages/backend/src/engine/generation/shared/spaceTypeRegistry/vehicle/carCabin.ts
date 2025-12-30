/**
 * Vehicle Car Cabin - Interior of an automotive vehicle
 */

import type { SpaceTypeDefinition } from '../types';

export const VEHICLE_CAR_CABIN: SpaceTypeDefinition = {
  id: 'vehicle-car-cabin',
  containerType: 'vehicle-car',
  perspective: 'interior',
  description: 'Interior of an automotive vehicle',
  hasRoof: true,
  hasWalls: 'full',
  dnaGuidance: `
PERSPECTIVE: INTERIOR (Vehicle - Car)
- This is the interior cabin of an automotive vehicle (car, truck, van, bus)
- COMPACT space - much smaller than a room, sized for seated passengers
- Focus on: dashboard, steering wheel, seats, center console, gear shift, windows
- Materials: leather/fabric upholstery, plastic trim, metal accents, glass windows
- Lighting: dashboard glow, ambient lighting, sunlight through windows
- DO NOT describe as a room or use building terminology
- NavigableElements: doors to exit vehicle, trunk/boot access, views through windows`,
  structureGuidance: `
VEHICLE CABIN (Car/Truck/Van):
- COMPACT enclosed space - vehicle scale, NOT room scale
- scale MUST be "small" (2-4m at most)
- Automotive materials: leather, fabric, plastic, glass, metal
- Standard vehicle layout: front seats, dashboard, windows all around
- Consider vehicle type: sedan, SUV, truck, van, sports car`,
  imageConstraints: [
    '[CRITICAL: VEHICLE INTERIOR - This is a CAR/TRUCK cabin, NOT a room]',
    '[SCALE: Compact automotive interior - seats, dashboard, windshield visible]',
    '[MATERIALS: Automotive only - leather/fabric seats, plastic/metal dashboard, glass windows]',
    '[DO NOT SHOW: Building materials (wood floors, brick walls, plaster ceilings)]'
  ],
  typicalMaterials: ['leather', 'fabric upholstery', 'plastic trim', 'brushed metal', 'glass', 'rubber', 'carpet'],
  excludeElements: ['wood floors', 'brick', 'stone walls', 'plaster', 'chandelier', 'fireplace', 'building fixtures']
};
