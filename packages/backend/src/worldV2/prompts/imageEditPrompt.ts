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
import { compileStyleLock, buildStyleLock } from '../utils/styleLockCompiler';

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
 */
export function buildEnterImageEditPrompt(context: ImageEditContext): string {
  const spaceName = context.spaceName || 'the interior';
  const parentName = context.parentName || 'the building';
  
  // Build style lock from DNA (simple: DNA in → style lock out)
  const styleLock = buildStyleLock(context.effectiveDNA);
  
  // Get first sentence of description as reveal
  const revealText = context.targetDescription.split('.')[0] + '.';
  
  // Build environment context for preserve section
  const envParts: string[] = [];
  if (context.timeOfDay) envParts.push(context.timeOfDay.replace(/_/g, ' '));
  if (context.weather) envParts.push(context.weather);
  const envContext = envParts.length > 0 ? envParts.join(', ') : 'current lighting';

  const prompt = `Move the camera forward through the entrance and enter ${spaceName}.

Target location:
Interior of ${spaceName} within ${parentName}.

Camera:
Eye-level, just inside the threshold, facing inward from the doorway.

Reveal:
${revealText}

Preserve:
Exterior architecture, building identity, scale, ${envContext}.

STYLE LOCK — NON-NEGOTIABLE:

${styleLock}

Constraints:
This is an interior space.
Do not show exterior viewpoints.
No new building geometry.
Maintain grounded realism.`;

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
