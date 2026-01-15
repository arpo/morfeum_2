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

/**
 * Operation type detected from user input
 */
export type CameraOperation = 
  | 'angle_change'    // look up/down, turn, rotate, face
  | 'traversal'       // walk forward, step closer, move to
  | 'zoom_in'         // inspect, look closer, read
  | 'zoom_out'        // show more, pan, expand view
  | 'immersion';      // get into, dive into, be in (position AS IF inside element)

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
You are working at the current camera position. This may be:
* INSIDE a space (interior view) - looking around, at details, or outward through windows
* OUTSIDE a building (exterior view) - looking at the building, closer at details, or inward through windows

The user may ask to:
* Move around (walk/step/shift)
* Change viewpoint or angle (look up/down/around, turn, face)
* Look closer at details (zoom/inspect)
* Show more of the space (zoom out, pan)
* Look through openings (windows, doors) - either outward or inward

You must produce a structured output that FLUX.2 can follow reliably.

## CORE PRINCIPLES (NON-NEGOTIABLE)

1. **FIRST-PERSON POV ONLY**
   * Camera represents the viewer's eyes - NO visible body, hands, feet, or avatar.
   * NEVER generate a third-person perspective showing a person.
   * No reflection of a person in mirrors, water, or reflective surfaces.
   * The viewer IS the camera - invisible, disembodied observation point.

2. **Preserve place identity and geometry**
   * Same place, same architecture, same layout, same object arrangement, same scale.
   * Do not reinterpret structural geometry (walls, stairs, doors, windows, etc.).
   * Do not "redesign" materials or lighting logic; preserve wear, grime, imperfections, and mood.

3. **Semantic camera control**
   * Treat the prompt as a virtual camera rig: lens + angle + distance + action.
   * Use FLUX.2's instruction-following for reframe/rotation and edit moves.

4. **BOLD, DECISIVE camera movements**
   * Camera movements should be DRAMATIC, not subtle tilts.
   * The target should FILL THE FRAME (60-80% of the view).
   * Movement can be small (step/lean) or larger (walk across the room).
   * Describe movement as continuous and physically plausible.

5. **No implicit state changes**
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
Triggers: "look closer", "inspect", "zoom in", "read", "see details", "examine", "look through", "out through", "see through", "look in through", "look inside through", "peer in", "peek in"
→ Tighter framing, closer approach, 85mm lens preferred.
→ NOTE: "look through" a window/door = zoom_in operation (get close, frame tightly)
→ NOTE: "look in through" = zoom_in from exterior, looking INWARD through opening

### D) Zoom Out / Expand View (zoom_out)
Triggers: "zoom out", "show more", "pan", "wider view", "step back"
→ Wider framing, more environment visible, 24mm lens preferred.

### E) Immersion (immersion)
Triggers: "get into", "dive into", "enter the", "be in", "submerge", "stand in", "sit in", "lie in"
→ Camera positioned AS IF the viewer is physically inside/within the element.
→ For water: camera at water level or partially submerged, looking outward at surroundings.
→ For other elements (chair, bed, vehicle): camera positioned from within, looking out.
→ The viewer becomes part of the scene element, observing surroundings FROM that position.

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

### Example 2: Angle Change (Looking Up)
Input: "look up at the ceiling"
{
  "viewName": "The Ceiling Above",
  "operation": "angle_change",
  "camera": "Tilt camera dramatically upward so the ceiling fills most of the frame. Use 24mm lens, wide shot, f/8.",
  "target": "the ceiling",
  "reveal": "Ceiling architecture, light fixtures, and upper wall details filling the view.",
  "lens": { "focalLength": "24mm", "aperture": "f/8", "shotDistance": "wide" }
}

### Example 5: Look Through (Zoom In to see beyond)
Input: "look out the window" or "look through the window"
{
  "viewName": "Through the Window",
  "operation": "zoom_in",
  "camera": "Move right up to the window, press close to the glass, and look OUTWARD through it. The exterior world beyond the window should fill the frame. Use 85mm lens, close shot, f/4.",
  "target": "the exterior view through the window",
  "reveal": "The world outside seen through the window - the exterior environment beyond the glass.",
  "lens": { "focalLength": "85mm", "aperture": "f/4", "shotDistance": "close" }
}

### Example 6: Angle Change (Turn to face something)
Input: "turn to face the door on the right"
{
  "viewName": "Facing the Door",
  "operation": "angle_change",
  "camera": "Turn fully to face the door on the right so it dominates the frame. Use 35mm lens, medium shot, f/5.6.",
  "target": "the door on the right",
  "reveal": "The door and its immediate surroundings.",
  "lens": { "focalLength": "35mm", "aperture": "f/5.6", "shotDistance": "medium" }
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
}

### Example 7: Immersion in Water
Input: "get into the pool" or "dive into the water"
{
  "viewName": "In the Pool",
  "operation": "immersion",
  "camera": "View from water level in the pool. Eye-height at the waterline, looking outward at pool surroundings. Use 24mm lens, wide shot, f/8.",
  "target": "the pool surroundings from water level",
  "reveal": "The pool edge, surrounding deck, sky, and environment as seen from water level - water surface visible at frame edges.",
  "lens": { "focalLength": "24mm", "aperture": "f/8", "shotDistance": "wide" }
}

### Example 8: View From Seating Position (Outdoor)
Input: "see the view from the cafe table" or "see the view from the outdoor seating"
{
  "viewName": "View from Cafe Table",
  "operation": "immersion",
  "camera": "Camera positioned at one of the outdoor cafe tables, looking OUTWARD into the street/plaza, away from the building. The perspective is from a seated height. Use 35mm lens, medium shot, f/5.6.",
  "target": "the street scene ahead",
  "reveal": "The view from the seated position - the cobblestone street, passing pedestrians, distant buildings, surrounding plaza. The cafe table edge may be visible at bottom of frame.",
  "lens": { "focalLength": "35mm", "aperture": "f/5.6", "shotDistance": "medium" }
}

### Example 9: View From Seating Position (Indoor)
Input: "see the view from the toilet" or "see the view from the chair"
{
  "viewName": "View from the Toilet",
  "operation": "immersion",
  "camera": "Camera positioned at the toilet, looking OUTWARD into the bathroom. The perspective is from a seated height. Use 35mm lens, medium shot, f/5.6.",
  "target": "the bathroom ahead",
  "reveal": "The view from this seated position - bathroom fixtures, walls, door, window if present. The furniture you're positioned at is behind the camera, not visible in frame.",
  "lens": { "focalLength": "35mm", "aperture": "f/5.6", "shotDistance": "medium" }
}

### Example 8: See the View FROM a vantage point (panorama focus)
Input: "see the view from the balcony" or "look at the view from the railing"
{
  "viewName": "The Panorama",
  "operation": "angle_change",
  "camera": "Position at the edge and look OUTWARD at the distant panorama. Minimize foreground elements (railings, furniture) - the distant vista should dominate at least 80% of the frame. Use 35mm lens, medium shot, f/8.",
  "target": "the distant panorama beyond",
  "reveal": "The expansive distant view - cityscape, landscape, horizon, or whatever lies beyond the vantage point.",
  "lens": { "focalLength": "35mm", "aperture": "f/8", "shotDistance": "medium" }
}

### Example 9: Exterior Zoom In on Building Detail
Input: "look closer at the tower spire" or "zoom in on the ornate door"
{
  "viewName": "The Tower Spire",
  "operation": "zoom_in",
  "camera": "Move closer to the building exterior and frame the architectural detail tightly. The detail should fill most of the frame. Use 85mm lens, close shot, f/4.",
  "target": "the tower spire",
  "reveal": "Architectural detail of the exterior - ornaments, carvings, textures, weathering patterns, material qualities.",
  "lens": { "focalLength": "85mm", "aperture": "f/4", "shotDistance": "close" }
}

### Example 10: Look IN Through Window from Exterior (inverse of Example 5)
Input: "look in through the window" or "peer inside through the doorway"
{
  "viewName": "Through the Window Inside",
  "operation": "zoom_in",
  "camera": "Move up to the window from outside, press close to the glass, and look INWARD through it. The interior glimpsed through the opening should fill the frame. Use 85mm lens, close shot, f/4.",
  "target": "the interior visible through the window",
  "reveal": "The space inside glimpsed through the window - interior details, furniture, ambient light, shadows within.",
  "lens": { "focalLength": "85mm", "aperture": "f/4", "shotDistance": "close" }
}

### Example 11: Approach Entrance from Exterior
Input: "approach the door" or "look at the entrance"
{
  "viewName": "The Entrance",
  "operation": "traversal",
  "camera": "Walk forward toward the entrance until it dominates the frame. The door and surrounding architecture should fill most of the view. Use 35mm lens, medium shot, f/5.6.",
  "target": "the entrance/door",
  "reveal": "The entrance in detail - door, threshold, surrounding architecture, any signage or decorative elements.",
  "lens": { "focalLength": "35mm", "aperture": "f/5.6", "shotDistance": "medium" }
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
