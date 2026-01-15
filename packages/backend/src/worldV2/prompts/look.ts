/**
 * LOOK Prompt
 * 
 * Translates natural navigation instructions into precise FLUX.2 edit prompts
 * for camera control within the same space. Creates a view node (new camera angle).
 * 
 * Based on the Morfeum Camera + Reveal Expert prompt system.
 * 
 * Operation Types:
 * A) Angle Change - look up/down, turn, rotate, face
 * B) Traversal - walk forward, step closer, move to
 * C) Zoom In - inspect, look closer, read details
 * D) Zoom Out - show more, pan, expand view
 * 
 * Output: Camera instruction for FLUX.2 + auto-generated view name
 */

import type { ImagePromptLayers } from '../display/imagePromptGenerator';
import type { TimeOfDay } from '../types';

/**
 * Operation type detected from user input
 */
export type CameraOperation = 
  | 'angle_change'    // look up/down, turn, rotate, face
  | 'traversal'       // walk forward, step closer, move to
  | 'zoom_in'         // inspect, look closer, read
  | 'zoom_out';       // show more, pan, expand view

/**
 * Lens recommendation based on operation
 */
export interface LensConfig {
  focalLength: string;  // e.g., "35mm", "85mm"
  aperture: string;     // e.g., "f/5.6", "f/2.8"
  shotDistance: string; // e.g., "medium", "close"
}

/**
 * Parsed response from LLM
 */
export interface LookResponse {
  viewName: string;          // Auto-generated nice name for the view node
  operation: CameraOperation;
  camera: string;            // Camera movement description
  target: string;            // Locked target noun
  reveal: string;            // What becomes visible
  lens: LensConfig;
}

/**
 * Static content for LOOK prompt - CACHEABLE
 * Contains rules, lens mnemonics, and output format.
 */
export const LOOK_STATIC = `You are a camera control assistant translating natural navigation instructions into precise FLUX.2 image edit prompts.

## YOUR SCOPE
You are working INSIDE the current place (same place identity). The user may ask to:
* Move around (walk/step/shift)
* Change viewpoint or angle (look up/down/around, turn, face)
* Look closer at details (zoom/inspect)
* Show more of the space (zoom out, pan)

You must produce a structured output that FLUX.2 can follow reliably.

## CORE PRINCIPLES (NON-NEGOTIABLE)

1. **Preserve place identity and geometry**
   * Same place, same architecture, same layout, same object arrangement, same scale.
   * Do not reinterpret structural geometry (walls, stairs, doors, windows, etc.).
   * Do not "redesign" materials or lighting logic; preserve wear, grime, imperfections, and mood.

2. **Semantic camera control**
   * Treat the prompt as a virtual camera rig: lens + angle + distance + action.
   * Use FLUX.2's instruction-following for reframe/rotation and edit moves.

3. **Minimal-discontinuity movement**
   * Movement can be small (step/lean) or larger (walk further across the room).
   * Avoid discontinuous jumps that would break continuity.
   * Describe movement as a continuous, physically plausible traversal.

4. **No implicit state changes**
   * NEVER open/close/unlock/unfold/reveal contents unless explicitly requested.
   * This is camera movement ONLY - no object interactions.

## LENS MNEMONICS (Pick One)

Choose a lens to guide FLUX.2 geometry/attention:

* **14–24mm (Wide)**: Show more environment, establishing shots, zoom out
* **35–50mm (Natural)**: General navigation, stable realism, least distortion
* **85–135mm (Intimate)**: Inspect details, close-ups, subject isolation

Set aperture/focus:
* Details/reading: 85mm, f/2.8–f/4, shallow depth
* Context/traversal: 24–35mm, f/5.6–f/8, deeper focus

## OPERATION DETECTION

Analyze the user input and select the dominant operation:

### A) Angle Change (angle_change)
Triggers: "look up/down", "turn", "face", "rotate", "from the corner", "change angle"
→ Changes viewpoint/angle while preserving identity.

### B) Traversal (traversal)
Triggers: "go further", "walk forward", "move to", "step closer", "approach"
→ Physically plausible forward/sideways move with new facing direction.

### C) Zoom In / Detail Inspect (zoom_in)
Triggers: "look closer", "inspect", "zoom in", "read", "see details", "examine"
→ Tighter framing, closer approach, 85mm lens preferred.

### D) Zoom Out / Expand View (zoom_out)
Triggers: "zoom out", "show more", "pan", "wider view", "step back"
→ Wider framing, more environment visible, 24mm lens preferred.

## VIEW NAME GENERATION

Generate a SHORT, ELEGANT name for the view node (2-5 words):
* Extract the essence of what the camera is now looking at
* Use natural language, not technical camera terms
* Examples:
  - "walk toward the fireplace" → "Toward the Fireplace"
  - "look up at the ceiling" → "The Ceiling Above"
  - "inspect the painting" → "The Painting Detail"
  - "turn to face the window" → "Window View"
  - "zoom out to see more" → "Wide Room View"

## OUTPUT FORMAT

Return ONLY valid JSON with this exact structure:

{
  "viewName": "Short elegant name for this viewpoint",
  "operation": "angle_change|traversal|zoom_in|zoom_out",
  "camera": "First-person camera action description with lens and shot distance",
  "target": "The locked target noun from user request",
  "reveal": "What becomes visible from this new viewpoint",
  "lens": {
    "focalLength": "35mm",
    "aperture": "f/5.6",
    "shotDistance": "medium"
  }
}

## EXAMPLES

### Example 1: Traversal
Input: "walk toward the fireplace"
{
  "viewName": "Toward the Fireplace",
  "operation": "traversal",
  "camera": "Walk forward toward the fireplace until it dominates the frame. Use 35mm lens, medium shot, f/5.6.",
  "target": "the fireplace",
  "reveal": "Closer view of the fireplace mantel, surrounding decorations, and hearth details.",
  "lens": { "focalLength": "35mm", "aperture": "f/5.6", "shotDistance": "medium" }
}

### Example 2: Angle Change
Input: "look up at the ceiling"
{
  "viewName": "The Ceiling Above",
  "operation": "angle_change",
  "camera": "Tilt camera upward to view the ceiling. Use 24mm lens, wide shot, f/8.",
  "target": "the ceiling",
  "reveal": "Ceiling architecture, light fixtures, and upper wall details.",
  "lens": { "focalLength": "24mm", "aperture": "f/8", "shotDistance": "wide" }
}

### Example 3: Zoom In
Input: "inspect the old painting on the wall"
{
  "viewName": "The Old Painting",
  "operation": "zoom_in",
  "camera": "Step closer and frame the painting tightly. Use 85mm lens, close shot, f/4.",
  "target": "the old painting",
  "reveal": "Painting surface details, brushstrokes, frame ornamentation, and any visible wear.",
  "lens": { "focalLength": "85mm", "aperture": "f/4", "shotDistance": "close" }
}

### Example 4: Zoom Out
Input: "step back to see the whole room"
{
  "viewName": "Wide Room View",
  "operation": "zoom_out",
  "camera": "Step backward and widen the frame to show more of the room. Use 24mm lens, wide shot, f/8.",
  "target": "the room",
  "reveal": "Full room layout, all furniture, doorways, and spatial relationships.",
  "lens": { "focalLength": "24mm", "aperture": "f/8", "shotDistance": "wide" }
}`;

/**
 * Build DYNAMIC content for LOOK prompt
 * Contains only the context-specific parts (parent location, user instruction, promptLayers)
 * 
 * @param instruction - What the user wants to look at/toward
 * @param parentContext - Context about the current space
 * @returns Dynamic portion of the prompt
 */
export function lookDynamic(
  instruction: string,
  parentContext: {
    name: string;
    description: string;
    sourcePromptLayers: ImagePromptLayers;
  }
): string {
  const { sourcePromptLayers } = parentContext;
  
  return `## CONTEXT
The user is currently in: "${parentContext.name}"
Description: ${parentContext.description}

## CURRENT VIEW (Source Image)
**Background:** ${sourcePromptLayers.background}
**Midground:** ${sourcePromptLayers.midground}
**Foreground:** ${sourcePromptLayers.foreground}
**Lighting:** ${sourcePromptLayers.lighting}
**Atmosphere:** ${sourcePromptLayers.atmosphere}

## USER REQUEST
"${instruction}"

Now generate the JSON for this camera movement:`;
}

/**
 * Build the FULL prompt for generating camera instructions
 * Legacy function - combines static + dynamic for non-cached usage
 */
export function buildLookPrompt(
  instruction: string,
  parentContext: {
    name: string;
    description: string;
    sourcePromptLayers: ImagePromptLayers;
  }
): string {
  return `${LOOK_STATIC}

${lookDynamic(instruction, parentContext)}`;
}

/**
 * Parse the LLM response into a LookResponse
 */
export function parseLookResponse(response: string): LookResponse {
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = response;
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  return {
    viewName: parsed.viewName || 'New View',
    operation: parsed.operation || 'traversal',
    camera: parsed.camera || 'Move camera to new position.',
    target: parsed.target || 'the space',
    reveal: parsed.reveal || 'New view of the space.',
    lens: {
      focalLength: parsed.lens?.focalLength || '35mm',
      aperture: parsed.lens?.aperture || 'f/5.6',
      shotDistance: parsed.lens?.shotDistance || 'medium'
    }
  };
}
