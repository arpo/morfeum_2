/**
 * Reusable Prompt Sections
 * Shared sections used across different prompt types
 */

/**
 * Composition layering instructions
 */
export function buildCompositionLayering(type: 'interior' | 'exterior'): string {
  return `COMPOSITION LAYERING (MANDATORY - Your output MUST include all three layers):

FOREGROUND (0-3 meters from camera):
- Immediate floor/ground surface details and texture
- Close architectural elements within arm's reach
- Near-side wall surfaces and details
- Anything you could touch from the camera position

MIDGROUND (3-10 meters):
- Navigation features (corridors, stairs, platforms, passages)
- Architectural details (machinery, panels, conduits, vents)
- Main structural elements
- Spatial transitions and connections

BACKGROUND (10+ meters / far distance):
- Where the space continues or ends
- Distant lighting and atmospheric effects
- Far end of corridor/chamber/passage
- Depth and spatial extent

CRITICAL: Each layer must be explicitly described SEPARATELY in your final output.
Do NOT combine or skip layers. Use clear spatial organization.`;
}

/**
 * Navigation guidance instructions
 */
export function buildNavigationGuidance(customFeatures?: string): string {
  if (customFeatures) {
    return `
CUSTOM NAVIGATION FEATURES (REQUIRED):
${customFeatures}

Integrate these specific features into the scene naturally.`;
  }

  return `
NAVIGATION & SPATIAL FEATURES (REQUIRED - include 3-4 SPECIFIC features):
Be CONCRETE and DETAILED. Avoid vague descriptions.

SPECIFICITY REQUIREMENTS:
✅ Good: "3-meter-wide side corridor branching left at 45 degrees, grated metal floor visible, warm orange glow from interior"
✅ Good: "Rusted metal ladder on right wall ascending to upper maintenance catwalk 6 meters up, with visible access hatch"
✅ Good: "Large circular vent opening ahead-right, 2m diameter, glowing interior visible with steam wisps"

❌ Bad: "narrow side passages"
❌ Bad: "some doorways"  
❌ Bad: "architectural details"

CHOOSE 3-4 SPECIFIC FEATURES:
- EXACT corridor/passage: Specify width, direction, angle, what's visible inside
- EXACT platform/walkway: Specify height, side (left/right), material, destination
- EXACT stairs/ladder: Specify location, direction (up/down), material, where it leads
- EXACT machinery/panel: Specify size, exact position, type, condition
- EXACT opening/vent: Specify size, shape, position, what's visible through it
- EXACT conduits/pipes: Specify diameter, routing path, material, quantity`;
}

/**
 * Navigable elements marking instructions
 */
export function buildNavigableElementsInstructions(): string {
  return `NAVIGABLE ELEMENTS MARKING (Required):
When describing navigable features in your scene, mark them inline using this natural format:

[description of element] (navigable: [type], [position])

TYPE OPTIONS:
- passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object

POSITION: Natural language describing side and layer
- Examples: "left side, midground" | "right wall, foreground" | "ahead, background" | "center, midground"

EXAMPLES:
✅ "A large circular vent, 2 meters in diameter, emits warm orange light from the right wall (navigable: opening, right wall, midground)."
✅ "To the left, a rusted metal ladder (navigable: ladder, left wall, midground) ascends along the curved wall."
✅ "A narrow corridor branches left at 30 degrees (navigable: corridor, left side, midground), with grated metal floor."
✅ "The corroded metal floor features drainage grates (navigable: object, center, foreground) with bioluminescent moss."

CRITICAL: Mark 3-4 navigable elements inline. These will later be extracted by an LLM to generate structured navigation data.
Make positions consistent with your description - if you write "left", mark it "left side" or "left wall", not "right".`;
}

/**
 * Extract entrance element from decision reasoning
 */
export function extractEntranceElement(reasoning?: string): string {
  if (!reasoning) return 'this structure';
  
  // Example: "Creating interior niche based on Massive cylindrical structures (midground/background) in The Pollen Vents"
  // Extract: "Massive cylindrical structures"
  const match = reasoning.match(/based on (.+?) (?:\(|in)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return 'this structure';
}
