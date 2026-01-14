/**
 * Image Edit Prompt Builder
 * 
 * Assembles prompts for the fal-flux-2-turbo-edit model following the Navigation spec format:
 * 1. STYLE LOCK (compiled from effective DNA) - using unified buildStyleLock
 * 2. PROHIBITIONS (from forbiddenTransformations + command-specific bans)
 * 3. ACTION (command-specific instruction) - declarative "camera IS now inside"
 * 
 * This creates highly constrained prompts that maintain visual consistency
 * when editing images for navigation.
 */

import type { DNA } from '../types';
import type { SpaceType } from './goInside';
import { compileStyleLock, buildStyleLock, buildStyleLockForSpace } from '../utils/styleLockCompiler';

/**
 * Context for building an image edit prompt
 */
export interface ImageEditContext {
  /** The target space description */
  targetDescription: string;
  /** The space type (indoor, outdoor, etc.) */
  spaceType: SpaceType;
  /** Effective DNA for style lock (merged parent + child) */
  effectiveDNA: DNA;
  /** Parent DNA BEFORE merging child delta - used for Palette (source image colors) */
  parentDNA: DNA;
  /** Node-specific forbidden transformations */
  forbiddenTransformations: string[];
  /** Parent location name for context */
  parentName: string;
  /** Space name for specific references */
  spaceName?: string;
  /** Interior details from LLM (what's visible inside) */
  interiorDetails?: string[];
  /** Weather conditions (from host) */
  weather?: string;
  /** Time of day (from host) */
  timeOfDay?: string;
}


/**
 * Build image edit prompt for GO_INSIDE2 (entering a new space)
 * 
 * Uses SIMPLE ACTION-ORIENTED format with UNIFIED STYLE LOCK
 * Generic solution that works for any space type (indoor, outdoor, underground, etc.)
 */
export function buildEnterImageEditPrompt(context: ImageEditContext): string {
  const spaceName = context.spaceName || 'the space';
  const parentName = context.parentName || 'the area';
  
  // Build style lock with space-type-aware filtering to remove inappropriate inherited elements
  const styleLock = buildStyleLockForSpace(context.effectiveDNA, context.spaceType);
  
  // Get first sentence of description as reveal
  const revealText = context.targetDescription.split('.')[0] + '.';
  
  // Build environment context for preserve section
  const envParts: string[] = [];
  if (context.timeOfDay) envParts.push(context.timeOfDay.replace(/_/g, ' '));
  if (context.weather) envParts.push(context.weather);
  const envContext = envParts.length > 0 ? envParts.join(', ') : 'current lighting';

  const prompt = `You have entered ${spaceName}. Transform the view to show what you see from within this space.

Target location:
Inside ${spaceName} (within ${parentName}).

Camera position:
Eye-level, positioned within the space itself. You have stepped through the entrance into ${spaceName}. The entrance you came from is now behind you, and you are looking at the space around you.

Perspective:
Show the view FROM WITHIN the space, not approaching it or viewing it from outside. The camera has entered and is now inside. What you stepped through to enter is behind the camera position.

What to reveal:
${revealText}

Preserve from source:
Overall architectural character, scale, ${envContext}.

STYLE LOCK — NON-NEGOTIABLE:

${styleLock}

Constraints:
Show the space from within, as if you've stepped inside and are looking around.
The entrance/doorway is behind the camera - do not show it in the view.
Do not show the exterior or entrance view of the space.
Do not show the space from outside looking in.
You are now INSIDE this space - show what surrounds you from this interior position.
Maintain grounded realism and spatial continuity.`;

  // Log the prompt for debugging
  console.log('\n========== GO_INSIDE2 IMAGE EDIT PROMPT ==========');
  console.log(prompt);
  console.log('==================================================\n');

  return prompt;
}


/**
 * Build image edit prompt for REFRAME2 (camera move/orient within same space)
 * 
 * Based on the `/reframe` template from Navigation spec
 */
export function buildReframeImageEditPrompt(
  effectiveDNA: DNA,
  reframeInstruction: string,
  weather?: string,
  timeOfDay?: string
): string {
  const { styleLockText, prohibitionsText } = compileStyleLock(effectiveDNA);

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
  targetDetail: string,
  weather?: string,
  timeOfDay?: string
): string {
  const { styleLockText, prohibitionsText } = compileStyleLock(effectiveDNA);

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
  targetDescription: string,
  weather?: string,
  timeOfDay?: string
): string {
  const { styleLockText, prohibitionsText } = compileStyleLock(targetDNA);

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
