/**
 * Image Edit Prompt Builder
 * 
 * Assembles prompts for the fal-flux-2-turbo-edit model following the scene-expert skill format.
 * Uses promptLayers for visual style preservation across navigation.
 * 
 * Key principles from scene-expert skill:
 * - Style lock must PRESERVE, not reinvent
 * - Camera physics is king (position, orientation)
 * - Enclosure must be asserted (solid ceiling)
 * - Megastructure interior paradox protection
 * - Threshold trap avoidance (entrance behind camera)
 */

import type { SpaceType } from './goInside';
import type { ImagePromptLayers } from '../display/imagePromptGenerator';
import type { TimeOfDay } from '../types';

/**
 * Prompt layers for interior space (without name/description)
 */
interface TargetPromptLayers {
  background: string;
  midground: string;
  foreground: string;
  lighting: string;
  atmosphere: string;
}

/**
 * Context for building an image edit prompt
 */
export interface ImageEditContext {
  /** Source image's visual style - what we're preserving */
  sourcePromptLayers: ImagePromptLayers;
  /** Target interior's visual description - what we're creating */
  targetPromptLayers: TargetPromptLayers;
  /** The space type (indoor, outdoor, etc.) */
  spaceType: SpaceType;
  /** Space name for specific references */
  spaceName: string;
  /** Parent location name for context */
  parentName: string;
  /** Weather conditions (from host) */
  weather?: string;
  /** Time of day (from host) */
  timeOfDay?: TimeOfDay;
}

/**
 * Build enclosure assertions based on space type
 * Following scene-expert skill guidance on enclosure
 */
function buildEnclosureAssertions(spaceType: SpaceType): string {
  switch (spaceType) {
    case 'indoor':
      return `Physical constraints:
Solid ceiling above. Fully enclosed interior. No sky visible.
Indirect lighting only - light enters through openings not visible in frame.
The entrance is behind the camera position.`;

    case 'underground':
      return `Physical constraints:
Solid rock/earth ceiling above. Fully enclosed underground space. No sky, no exterior openings.
Indirect or artificial lighting only. Carved into the mass, not a void.
The entrance passage is behind the camera position.`;

    case 'semi-enclosed':
      return `Physical constraints:
Partial roof/covering visible above. Semi-enclosed space with filtered light.
Some sky may be visible through gaps, but primary view is sheltered.
The entrance is behind the camera position.`;

    case 'elevated':
      return `Physical constraints:
Open to sky above (balcony/terrace). Railing or edge defines the boundary.
Natural lighting from above and sides.
The entrance back into the building is behind the camera position.`;

    case 'outdoor':
      return `Physical constraints:
Open sky above. Natural outdoor lighting.
Camera is within the outdoor space, not at its entrance.
The entrance/arrival point is behind the camera position.`;

    default:
      return `Physical constraints:
Camera is within the space, entrance behind.
Maintain spatial continuity.`;
  }
}

/**
 * Build megastructure protection clause
 * Prevents the "tower inside tower" bug for large singular structures
 */
function buildMegastructureProtection(parentName: string): string {
  // Check if parent sounds like a megastructure
  const megastructurePatterns = /tower|spire|monolith|sphere|dome|pyramid|obelisk|citadel|fortress|temple|cathedral|palace|castle/i;
  
  if (megastructurePatterns.test(parentName)) {
    return `
Megastructure rule:
The ${parentName} is NOT visible as an object inside this interior.
This space is CARVED INTO the mass of the structure, not a void containing it.
Do not show the structure's exterior form from inside.`;
  }
  
  return '';
}

/**
 * Build prohibitions based on space type
 * Following scene-expert guidance on what to ban
 */
function buildProhibitions(spaceType: SpaceType): string {
  const common = [
    'Do not frame the entrance door/opening in the view',
    'Do not show exterior establishing shot',
    'Do not reinterpret the architectural style'
  ];

  const spaceSpecific: Record<SpaceType, string[]> = {
    'indoor': [
      'No sky visible through ceiling',
      'No open roof or atrium to sky',
      'No exterior landscape visible'
    ],
    'underground': [
      'No sky visible',
      'No surface-level features',
      'No central pillar/spire structure',
      'No atrium or void to surface'
    ],
    'semi-enclosed': [
      'No fully open roof',
      'No interior room appearance'
    ],
    'elevated': [
      'No interior room appearance',
      'No ground-level perspective'
    ],
    'outdoor': [
      'No interior room appearance',
      'No enclosed ceiling'
    ]
  };

  return [...common, ...(spaceSpecific[spaceType] || [])].map(p => `* ${p}`).join('\n');
}

/**
 * Build image edit prompt for GO_INSIDE2 (entering a new space)
 * 
 * Follows scene-expert skill format:
 * Action, Target location, Camera, Orientation, Reveal, Preserve, Style lock, Physical constraints, Prohibitions
 */
export function buildEnterImageEditPrompt(context: ImageEditContext): string {
  const { sourcePromptLayers, targetPromptLayers, spaceType, spaceName, parentName, weather, timeOfDay } = context;

  // Build environment context
  const envParts: string[] = [];
  if (timeOfDay) envParts.push(timeOfDay.replace(/_/g, ' '));
  if (weather) envParts.push(weather);
  const envContext = envParts.length > 0 ? envParts.join(', ') : 'current conditions';

  // Get enclosure and protection clauses
  const enclosureAssertions = buildEnclosureAssertions(spaceType);
  const megastructureProtection = buildMegastructureProtection(parentName);
  const prohibitions = buildProhibitions(spaceType);

  const prompt = `Action:
Move the camera forward into ${spaceName} and step fully inside.

Target location:
Interior space within ${parentName}.

Camera:
Human eye level, well inside the space, past the last exterior-facing opening.

Orientation:
Facing inward toward interior features. The entrance you came through is behind the camera.

Reveal:
${targetPromptLayers.midground}
${targetPromptLayers.foreground}

Preserve from source (CRITICAL - maintain visual continuity):
* Materials language: ${sourcePromptLayers.midground}
* Lighting quality: ${sourcePromptLayers.lighting} → adapted for ${spaceType} context
* Atmosphere tone: ${sourcePromptLayers.atmosphere}
* Environmental context: ${envContext}

Style lock — carry forward and apply to interior:
* Background: ${targetPromptLayers.background}
* Lighting: ${targetPromptLayers.lighting}
* Atmosphere: ${targetPromptLayers.atmosphere}

${enclosureAssertions}
${megastructureProtection}

Prohibitions:
${prohibitions}

Maintain grounded realism and spatial continuity with the source image.`;

  return prompt;
}


/**
 * Build image edit prompt for REFRAME2 (camera move/orient within same space)
 * Simplified version that preserves all visual elements
 */
export function buildReframeImageEditPrompt(
  sourcePromptLayers: ImagePromptLayers,
  reframeInstruction: string,
  weather?: string,
  timeOfDay?: TimeOfDay
): string {
  const envParts: string[] = [];
  if (timeOfDay) envParts.push(timeOfDay.replace(/_/g, ' '));
  if (weather) envParts.push(weather);
  const envContext = envParts.length > 0 ? `Environment: ${envParts.join(', ')}` : '';

  return `Action:
Reframe the camera within the current location.

Target location:
Same location (no location change).

Camera:
Human eye level; move to the specified position.

Preserve (CRITICAL - maintain all visual elements):
* Background: ${sourcePromptLayers.background}
* Midground: ${sourcePromptLayers.midground}
* Foreground: ${sourcePromptLayers.foreground}
* Lighting: ${sourcePromptLayers.lighting}
* Atmosphere: ${sourcePromptLayers.atmosphere}
${envContext}

Edit instruction:
${reframeInstruction}

Constraints:
No structural redesign; maintain spatial continuity.
Same place, only camera pose changes.

Prohibitions:
* Do not change location/node
* Do not introduce new objects
* Do not redesign materials, lighting, or mood
* No teleport establishing shots`;
}

/**
 * Build image edit prompt for INSPECT2 (zoom/focus on detail)
 * Close-up that preserves style lock
 */
export function buildInspectImageEditPrompt(
  sourcePromptLayers: ImagePromptLayers,
  targetDetail: string,
  weather?: string,
  timeOfDay?: TimeOfDay
): string {
  const envParts: string[] = [];
  if (timeOfDay) envParts.push(timeOfDay.replace(/_/g, ' '));
  if (weather) envParts.push(weather);
  const envContext = envParts.length > 0 ? `Environment: ${envParts.join(', ')}` : '';

  return `Action:
Inspect a specific detail closely.

Target location:
Same location, closer viewpoint.

Camera:
Move closer to the target at human eye level (or slight lean-in).

Orientation:
Center the target detail: ${targetDetail}

Preserve (maintain visual consistency):
* Materials from: ${sourcePromptLayers.midground}
* Lighting: ${sourcePromptLayers.lighting}
* Atmosphere: ${sourcePromptLayers.atmosphere}
${envContext}

Reveal:
Surface-level micro detail (texture, engraving, label, small objects) consistent with existing scene.

Constraints:
No new rooms. No new major objects.
Same materials and palette at close range.

Prohibitions:
* Do not reinterpret the object category
* Do not change the scene's era/genre
* Do not introduce new context`;
}
