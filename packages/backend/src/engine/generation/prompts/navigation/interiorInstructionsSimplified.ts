/**
 * Simplified Interior Space Instructions (v2)
 * 
 * This is the NEW simplified version that uses pre-computed structure data.
 * The structure analysis LLM has already determined form, scale, functionalType, etc.
 * This prompt just needs to compose the image description.
 * 
 * Compare to interiorInstructions.ts (legacy) which is ~150 lines of derivation logic.
 * This version is ~30 lines because derivation is done upstream.
 */

import type { Structure } from '../../../navigation/types';

/**
 * Generate simplified interior instructions using pre-computed structure
 * This replaces the complex derivation logic in the legacy template
 */
export function getSimplifiedInteriorInstructions(structure: Structure): string {
  return `
You are composing an interior scene description for image generation.

=== PRE-COMPUTED STRUCTURE DATA ===
Form: ${structure.form}
Scale: ${structure.scale}
Orientation: ${structure.orientation}
Roof/Ceiling: ${structure.roofType}
Functional Type: ${structure.functionalType}
Openings: ${structure.openings}

${structure.spatialLayout ? `Spatial Layout: ${structure.spatialLayout}` : ''}

=== REQUIRED ELEMENTS (MUST APPEAR IN IMAGE) ===
${structure.requiredElements && structure.requiredElements.length > 0 
  ? structure.requiredElements.map(el => `• ${el}`).join('\n')
  : '(none specified)'}

=== SUGGESTED FIXTURES ===
${structure.suggestedFixtures && structure.suggestedFixtures.length > 0
  ? structure.suggestedFixtures.join(', ')
  : 'appropriate fixtures for ' + structure.functionalType}

=== NAVIGABLE ELEMENTS (include with visual prominence) ===
${structure.navigableElements && structure.navigableElements.length > 0
  ? structure.navigableElements.map(n => `• ${n.type} at ${n.position}: ${n.description}`).join('\n')
  : '• door at back: main entrance'}

=== COMPOSITION RULES ===
- Use asymmetric composition (rule of thirds)
- Position navigable elements at 1/3 or 2/3 positions
- Create depth with foreground, midground, background layers
- Make navigable elements visually distinct (lighting, contrast, color)
- Interior must match the form (${structure.form}) and scale (${structure.scale})

=== OUTPUT ===
Write a rich, detailed interior scene description.
Include all required elements, fixtures, and navigable points.
Do NOT include the parent building in the background.
`;
}

/**
 * Legacy export for backward compatibility
 * Still used by generateImagePromptForNode in imagePromptGeneration.ts
 */
export { interiorInstructionsTemplate } from './interiorInstructions';
