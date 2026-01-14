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
 * 
 * IMPORTANT: For indoor spaces, we include universal rules that prevent common
 * edit-model failure modes (open roof, tower-inside-tower, etc.) without
 * needing any pattern-matching or detection. These assertions are simply
 * TRUE for any enclosed interior.
 */
function buildEnclosureAssertions(spaceType: SpaceType): string {
  switch (spaceType) {
    case 'indoor':
      // Universal indoor rules - these are TRUE for ANY enclosed interior
      // No detection needed - these statements never hurt
      return `Physical constraints:
Solid ceiling above. Fully enclosed interior. No sky visible.
The space is carved into the structure's mass — not a void containing the structure.
The structure itself is NOT visible as an object from inside.
Indirect lighting only — light enters through openings not visible in frame.
The entrance is behind the camera position.`;

    case 'underground':
      return `Physical constraints:
Solid rock/earth ceiling above. Fully enclosed underground space. No sky, no exterior openings.
The space is carved into the mass — not a void or cavern containing structures.
Indirect or artificial lighting only.
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
      'No exterior landscape visible',
      'No exterior vegetation unless interior description specifies overgrowth/abandoned'
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
 * Follows the proven scene-expert structure that prevents "tower inside tower" bug:
 * - Preserve = visual identity as SURFACE TREATMENT ONLY (not the object itself)
 * - Carry forward = explicit materials list from target
 * - Interior adaptation = how those materials transform for indoor context
 * - Physical constraints = strong enclosure assertions
 * - Prohibitions = ban central structures and exterior views
 */
export function buildEnterImageEditPrompt(context: ImageEditContext): string {
  const { sourcePromptLayers, targetPromptLayers, spaceType, spaceName, parentName, weather, timeOfDay } = context;

  // Build environment context
  const envParts: string[] = [];
  if (timeOfDay) envParts.push(timeOfDay.replace(/_/g, ' '));
  if (weather) envParts.push(weather);
  const envContext = envParts.length > 0 ? envParts.join(', ') : 'current conditions';

  // Get enclosure assertions and prohibitions
  const enclosureAssertions = buildEnclosureAssertions(spaceType);
  const prohibitions = buildProhibitions(spaceType);

  // Build the prompt following the proven working structure
  // CRITICAL: Do NOT pass sourcePromptLayers.midground or sourcePromptLayers.lighting directly
  // - midground contains object descriptions that cause "tower inside tower" bug
  // - lighting describes exterior light (sunlight etc) which causes openings/windows to appear
  const prompt = `Action:
Move the camera forward and step into ${spaceName}.

Target location:
Interior space carved inside ${parentName}.

Camera:
Human eye level, positioned well inside the structure.
The camera is past the entrance and past any exterior-facing opening.

Orientation:
Facing inward toward the interior.
The entrance is behind the camera and must not be visible.

Reveal:
An enclosed interior space within the structure.
${targetPromptLayers.midground}
${targetPromptLayers.foreground}

Preserve (visual identity as SURFACE TREATMENT ONLY):
The exterior's visual signature applied to interior walls and surfaces:
* Atmosphere tone: ${sourcePromptLayers.atmosphere}
* Environmental context: ${envContext} (influencing interior indirectly, not directly visible)

Style lock:
Preserve the exterior's aesthetic as surface treatment for interior walls.

Carry forward (apply to enclosing walls, floor, ceiling):
${targetPromptLayers.background}

Interior lighting and atmosphere (ADAPTED FOR ENCLOSED SPACE):
${targetPromptLayers.lighting}
${targetPromptLayers.atmosphere}

${enclosureAssertions}

Prohibitions:
${prohibitions}
* Do not create a central pillar, spire, column, or tower form inside the space
* Do not show the structure as an object visible from inside
* Do not show windows or openings to the exterior

Final constraint:
Show a grounded, enclosed interior that clearly belongs inside this structure and leads further inward.`;

  return prompt;
}


/**
 * Build image edit prompt for GO_INSIDE2 when entering a SEMI-ENCLOSED space
 * 
 * Parallel to buildEnterImageEditPrompt but optimized for partial enclosure.
 * Allows sky visibility through gaps, lattice, or partial roofing.
 * 
 * Use cases:
 * - Art installations with framework roofs
 * - Open-air temples and pavilions
 * - Gazebos, pergolas, covered markets
 * - Any structure with partial sky visibility
 */
export function buildEnterSemiEnclosedEditPrompt(context: ImageEditContext): string {
  const { sourcePromptLayers, targetPromptLayers, spaceType, spaceName, parentName, weather, timeOfDay } = context;

  // Build environment context
  const envParts: string[] = [];
  if (timeOfDay) envParts.push(timeOfDay.replace(/_/g, ' '));
  if (weather) envParts.push(weather);
  const envContext = envParts.length > 0 ? envParts.join(', ') : 'current conditions';

  // Build the prompt for semi-enclosed spaces
  const prompt = `Action:
Move the camera forward and step into ${spaceName}.

Target location:
A semi-enclosed space within ${parentName}.

Camera:
Human eye level, positioned inside the structure/pavilion.
The camera has moved past the entrance into the sheltered area.

Orientation:
Facing into the semi-enclosed space.
The entrance is behind the camera.

Reveal:
A partially covered space with sky visible through gaps, lattice, framework, or open sections.
${targetPromptLayers.midground}
${targetPromptLayers.foreground}

Preserve (visual identity and structural continuity):
The structure's visual signature:
* Atmosphere tone: ${sourcePromptLayers.atmosphere}
* Environmental context: ${envContext}

Style lock:
Maintain the structure's established aesthetic and materials.

Carry forward (structure and surroundings):
${targetPromptLayers.background}

Lighting and atmosphere (ADAPTED FOR SEMI-ENCLOSED SPACE):
${targetPromptLayers.lighting}
${targetPromptLayers.atmosphere}

Physical constraints:
PARTIAL sky visible through framework, lattice, gaps, or open roof sections.
NOT fully enclosed - some openings to sky are intentional and visible.
Natural light filters through the structure.
The entrance/arrival point is behind the camera position.
The structure provides shelter but is NOT sealed.

Prohibitions:
* The entrance must NOT be visible anywhere in the frame - it is behind the camera
* Do not show a FULLY enclosed interior with solid ceiling
* Do not show a FULLY open outdoor space with no structure
* Do not reinterpret the architectural/structural style
* No solid walls on all sides
* No completely sealed roof

Final constraint:
Show a sheltered but partially open space where sky is visible through the structure, creating filtered natural light.`;

  return prompt;
}


/**
 * Build image edit prompt for GO_INSIDE2 when entering an OUTDOOR space
 * 
 * Parallel to buildEnterImageEditPrompt but optimized for outdoor→outdoor transitions.
 * Instead of enclosure assertions, uses open-sky assertions.
 * 
 * Use cases:
 * - Entering a park (exterior → outdoor space within)
 * - Exploring a festival (exterior → outdoor area)
 * - Walking into a beach area (exterior → outdoor space)
 */
export function buildEnterOutdoorEditPrompt(context: ImageEditContext): string {
  const { sourcePromptLayers, targetPromptLayers, spaceType, spaceName, parentName, weather, timeOfDay } = context;

  // Build environment context
  const envParts: string[] = [];
  if (timeOfDay) envParts.push(timeOfDay.replace(/_/g, ' '));
  if (weather) envParts.push(weather);
  const envContext = envParts.length > 0 ? envParts.join(', ') : 'current conditions';

  // Build the prompt for outdoor-to-outdoor navigation
  const prompt = `Action:
Move the camera forward and enter ${spaceName}.

Target location:
An outdoor area within ${parentName}.

Camera:
Human eye level, positioned within the outdoor space.
The camera has moved past the entrance/arrival point into the open area.

Orientation:
Facing into the outdoor space.
The arrival/entrance point is behind the camera.

Reveal:
An open outdoor area with visible sky.
${targetPromptLayers.midground}
${targetPromptLayers.foreground}

Preserve (visual identity and environmental continuity):
The surrounding landscape's visual signature:
* Atmosphere tone: ${sourcePromptLayers.atmosphere}
* Environmental context: ${envContext}

Style lock:
Maintain the location's established aesthetic and visual style.

Carry forward (surrounding environment):
${targetPromptLayers.background}

Lighting and atmosphere (ADAPTED FOR OUTDOOR SPACE):
${targetPromptLayers.lighting}
${targetPromptLayers.atmosphere}

Physical constraints:
Open sky visible above. Outdoor space with natural lighting.
Surrounding landscape and horizon visible.
Natural environmental lighting from sun/sky.
The entrance/arrival point is behind the camera position.

Prohibitions:
* The entrance/arrival point must NOT be visible anywhere in the frame - it is behind the camera
* No park gates, entrance archways, arrival paths, or boundary markers visible
* Do not show exterior establishing shot (we're already in the space)
* Do not reinterpret the architectural/environmental style
* No enclosed interior elements
* No solid ceiling or roof covering the main view
* No walls enclosing the space

Final constraint:
Show a grounded, open outdoor space that clearly belongs within this location and invites further exploration.`;

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
