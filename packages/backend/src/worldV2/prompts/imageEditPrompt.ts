/**
 * Image Edit Prompt Builder
 * 
 * Assembles prompts for the fal-flux-2-turbo-edit model following the Navigation spec format:
 * 1. STYLE LOCK (compiled from effective DNA)
 * 2. PROHIBITIONS (from forbiddenTransformations + command-specific bans)
 * 3. ACTION (command-specific instruction)
 * 
 * This creates highly constrained prompts that maintain visual consistency
 * when editing images for navigation.
 */

import type { DNA } from '../types';
import type { SpaceType } from './goInside';
import { compileStyleLock, getEnterProhibitions } from '../utils/styleLockCompiler';

/**
 * Context for building an image edit prompt
 */
export interface ImageEditContext {
  /** The target space description */
  targetDescription: string;
  /** The space type (indoor, outdoor, etc.) */
  spaceType: SpaceType;
  /** Effective DNA for style lock */
  effectiveDNA: DNA;
  /** Node-specific forbidden transformations */
  forbiddenTransformations: string[];
  /** Parent location name for context */
  parentName: string;
  /** Weather conditions (from host) */
  weather?: string;
  /** Time of day (from host) */
  timeOfDay?: string;
}

/**
 * Build image edit prompt for GO_INSIDE2 (entering a new space)
 * 
 * Based on the `/enter` template from Navigation spec
 */
export function buildEnterImageEditPrompt(context: ImageEditContext): string {
  const { styleLockText, prohibitionsText } = compileStyleLock(
    context.effectiveDNA,
    [...context.forbiddenTransformations, ...getEnterProhibitions()]
  );

  const spaceTypeGuidance = getSpaceTypeGuidance(context.spaceType);
  const environmentContext = buildEnvironmentContext(context.weather, context.timeOfDay);

  return `You are performing a constrained image edit.
Preserve realism, material behavior, and continuity.

STYLE LOCK — NON-NEGOTIABLE:
${styleLockText}

(Inherit parent DNA; apply child overrides. Do NOT carry over parent spatial layout.)
${environmentContext}

ABSOLUTE PROHIBITIONS:
${prohibitionsText}

* Do not remain outside/at the doorway if the target is an interior.
* Do not keep the previous sub-location framing as dominant.

EDIT INSTRUCTION (CRITICAL):
Move the camera through a physical boundary into: ${context.targetDescription}

${spaceTypeGuidance}

The camera must end fully INSIDE the new space.
Render a view where the new space's surfaces and elements are the primary subject.
Maintain strict spatial continuity: same world, new sub-location authority.`;
}

/**
 * Build image edit prompt for REFRAME2 (camera move/orient within same space)
 * 
 * Based on the `/reframe` template from Navigation spec
 */
export function buildReframeImageEditPrompt(
  effectiveDNA: DNA,
  forbiddenTransformations: string[],
  reframeInstruction: string,
  weather?: string,
  timeOfDay?: string
): string {
  const { styleLockText, prohibitionsText } = compileStyleLock(
    effectiveDNA,
    forbiddenTransformations
  );

  const environmentContext = buildEnvironmentContext(weather, timeOfDay);

  return `You are performing a constrained image edit.
Preserve the original image's identity, materials, lighting logic, and scale exactly.
Do not reinterpret style, technology level, or surfaces.

STYLE LOCK — NON-NEGOTIABLE:
${styleLockText}
${environmentContext}

ABSOLUTE PROHIBITIONS:
${prohibitionsText}

* Do not change location/node.
* Do not introduce new objects.
* Do not redesign materials, lighting, or mood.

EDIT INSTRUCTION:
${reframeInstruction}

Maintain strict spatial continuity: same place, only camera pose changes.`;
}

/**
 * Build image edit prompt for INSPECT2 (zoom/focus on detail)
 * 
 * Based on the `/inspect` template from Navigation spec
 */
export function buildInspectImageEditPrompt(
  effectiveDNA: DNA,
  forbiddenTransformations: string[],
  targetDetail: string,
  weather?: string,
  timeOfDay?: string
): string {
  const { styleLockText, prohibitionsText } = compileStyleLock(
    effectiveDNA,
    forbiddenTransformations
  );

  const environmentContext = buildEnvironmentContext(weather, timeOfDay);

  return `You are performing a constrained image edit.
Preserve the original image's identity, materials, lighting logic, and scale exactly.
Do not reinterpret style, technology level, or surfaces.

STYLE LOCK — NON-NEGOTIABLE:
${styleLockText}
${environmentContext}

ABSOLUTE PROHIBITIONS:
${prohibitionsText}

* Do not change location/node.
* Do not introduce new objects.
* Do not alter global lighting or palette.

EDIT INSTRUCTION:
Inspect and zoom in on: ${targetDetail}
Move the camera closer to emphasize the same physical object/surface.
Preserve continuity of the same surface/material (no teleporting, no new context).`;
}

/**
 * Build image edit prompt for GOTO2 (jump to different node)
 * 
 * Based on the `/jump` template from Navigation spec
 */
export function buildJumpImageEditPrompt(
  targetDNA: DNA,
  forbiddenTransformations: string[],
  targetDescription: string,
  weather?: string,
  timeOfDay?: string
): string {
  const { styleLockText, prohibitionsText } = compileStyleLock(
    targetDNA,
    forbiddenTransformations
  );

  const environmentContext = buildEnvironmentContext(weather, timeOfDay);

  return `You are performing a constrained image edit.

STYLE LOCK — NON-NEGOTIABLE:
Discard the previous location's DNA/style lock entirely.
Apply ONLY the target node's effective DNA/style lock:

${styleLockText}
${environmentContext}

ABSOLUTE PROHIBITIONS:
${prohibitionsText}

EDIT INSTRUCTION:
Change the scene to the target location: ${targetDescription}
Establish the new place clearly (materials, lighting, palette, atmosphere) per the target lock.`;
}

/**
 * Get guidance text for different space types
 */
function getSpaceTypeGuidance(spaceType: SpaceType): string {
  switch (spaceType) {
    case 'indoor':
      return `SPACE TYPE: INTERIOR
The camera viewpoint is now INSIDE an enclosed interior volume.
Interior walls/ceiling should be visible or implied.
The entrance/exit may be visible behind or to the side.
The dominant view shows the interior space.`;

    case 'outdoor':
      return `SPACE TYPE: OUTDOOR
The camera viewpoint is now INSIDE an outdoor area (park, garden, plaza).
Open sky is visible above.
The boundary of this area (fences, hedges, edges) may frame the view.
Natural elements (trees, grass, paths) are the primary subject.`;

    case 'semi-enclosed':
      return `SPACE TYPE: SEMI-ENCLOSED
The camera viewpoint is now INSIDE a partially covered space.
Some open-air elements visible alongside covered/structural elements.
Columns, awnings, or partial roofing define the space.
Both natural light and structural shadows present.`;

    case 'underground':
      return `SPACE TYPE: UNDERGROUND
The camera viewpoint is now INSIDE a below-ground space.
Limited natural light, possibly from entrance above or artificial sources.
Rock, earth, or constructed walls visible.
Ceiling/cave roof is a prominent element.`;

    case 'elevated':
      return `SPACE TYPE: ELEVATED
The camera viewpoint is now ON an elevated outdoor platform.
Open sky visible, possibly distant views/horizon.
Railings, edges, or structural elements define the platform.
Height and openness are key spatial characteristics.`;

    default:
      return `The camera viewpoint is now INSIDE the new space.
Interior/space elements should wrap around the viewer.`;
  }
}

/**
 * Build environment context string from weather and time of day
 */
function buildEnvironmentContext(weather?: string, timeOfDay?: string): string {
  const parts: string[] = [];
  
  if (timeOfDay) {
    parts.push(`Time of day: ${timeOfDay.replace(/_/g, ' ')}`);
  }
  
  if (weather) {
    parts.push(`Weather conditions: ${weather}`);
  }
  
  return parts.length > 0 
    ? `\nENVIRONMENT:\n${parts.map(p => `* ${p}`).join('\n')}`
    : '';
}
