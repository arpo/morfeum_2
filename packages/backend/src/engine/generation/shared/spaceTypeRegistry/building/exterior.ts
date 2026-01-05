/**
 * Building Exterior - Fully open outdoor space
 */

import type { SpaceTypeDefinition } from '../types';

export const BUILDING_EXTERIOR: SpaceTypeDefinition = {
  id: 'building-exterior',
  containerType: 'building',
  perspective: 'exterior',
  description: 'Fully open outdoor space',
  hasRoof: false,
  hasWalls: 'none',
  dnaGuidance: `
PERSPECTIVE: EXTERIOR
- This is a fully open outdoor space (park path, plaza, garden, forest clearing, sculpture area)
- NO walls, NO ceiling - completely open to the environment
- Focus on natural features, pathways, zones, landmarks, sky/weather
- Describe spatial flow, vegetation, terrain, points of interest
- NavigableElements: paths to other areas, entrances to structures, viewpoints, gathering spots`,
  structureGuidance: `
EXTERIOR OUTDOOR SPACE:
- No walls or ceiling
- roofType MUST be "open-sky"
- Focus on landscape, terrain, vegetation, sky`,
  imageConstraints: [
    '[CRITICAL: OPEN-SKY - The sky is directly visible above. Show natural sky, clouds, weather.]'
  ],
  typicalMaterials: ['ground', 'grass', 'stone paths', 'natural elements'],
  excludeElements: ['ceiling', 'roof', 'enclosed walls'],
  imageLayerGuidance: {
    backgroundPriority: 'exterior-dominant',
    backgroundDescription: 'Sky, horizon, distant landscape, and environmental features dominate the background. Buildings or structures may be visible in the distance.',
    windowTreatment: 'No windows - this is an outdoor space. Structures in view are seen from the outside.'
  }
};
