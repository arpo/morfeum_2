/**
 * Generate View Descriptions Prompt
 * Creates text descriptions of different viewpoints (north/south/etc.) for multi-view navigation
 * Images generated lazily when user looks in that direction
 */

export const generateViewDescriptions = (
  seedJson: string,
  visualAnalysisJson: string,
  renderInstructions: string
): string => {
  return `You are a spatial reasoning AI that generates directional view descriptions for a location.

# INPUT DATA

## Seed Description
${seedJson}

## Visual Analysis (from default view)
${visualAnalysisJson}

## Default Render Instructions
${renderInstructions}

# TASK

Generate text descriptions for different viewpoints around this location. Consider:
- What would be visible looking in each direction
- How the scene changes from different angles
- What becomes prominent vs obscured in each view
- Spatial relationships between elements

# OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no explanation):

{
  "default": {
    "viewKey": "default",
    "looks": "3-5 sentence description of what you see in the default/main view",
    "focusTarget": "Main subject in this view (e.g., 'lighthouse and moon')",
    "renderInstructions": "Copy from default render instructions above",
    "hasImage": true
  },
  "north": {
    "viewKey": "north",
    "looks": "3-5 sentence description looking north",
    "focusTarget": "What's prominent looking north",
    "renderInstructions": "Camera: [position], looking north at [target], [framing], [lighting]",
    "hasImage": false
  },
  "south": {
    "viewKey": "south",
    "looks": "3-5 sentence description looking south",
    "focusTarget": "What's prominent looking south",
    "renderInstructions": "Camera: [position], looking south at [target], [framing], [lighting]",
    "hasImage": false
  },
  "east": {
    "viewKey": "east",
    "looks": "3-5 sentence description looking east",
    "focusTarget": "What's prominent looking east",
    "renderInstructions": "Camera: [position], looking east at [target], [framing], [lighting]",
    "hasImage": false
  },
  "west": {
    "viewKey": "west",
    "looks": "3-5 sentence description looking west",
    "focusTarget": "What's prominent looking west",
    "renderInstructions": "Camera: [position], looking west at [target], [framing], [lighting]",
    "hasImage": false
  }
}

# GUIDELINES

**Looks Field:**
- 3-5 sentences describing the view from this angle
- Mention what's in foreground, middle, background
- Note what's visible vs hidden from this perspective
- Keep it visual and spatial

**focusTarget Field:**
- Brief phrase (2-5 words) of main subject
- Example: "cliff face", "horizon and sea", "cave entrance"

**renderInstructions Field:**
- Camera position and orientation for future image generation
- Format: "Camera: [position], looking [direction] at [target], [framing], [lighting]"
- Maintain consistency with scene's lighting/atmosphere
- Example: "Camera: ground level, looking north at cave entrance, medium shot, moonlight"

**Spatial Coherence:**
- Ensure all views form a consistent 360° scene
- North view should be opposite of south view
- East should be opposite of west
- Elements should appear logically based on their position

# EXAMPLE

For a lighthouse on a cliff:

{
  "default": {
    "viewKey": "default",
    "looks": "The stone lighthouse rises dramatically against stormy skies. Waves crash against the cliff base far below. A winding path leads from the cliff edge to the lighthouse door. Rocky outcrops frame the scene on both sides.",
    "focusTarget": "lighthouse and stormy sky",
    "renderInstructions": "Camera: elevated position 30 meters from lighthouse, looking at lighthouse with cliff edge visible, medium-wide shot, stormy natural light",
    "hasImage": true
  },
  "north": {
    "viewKey": "north",
    "looks": "Looking north reveals the endless expanse of churning ocean. Dark storm clouds gather on the horizon. The cliff edge drops away sharply. Spray from crashing waves occasionally reaches this height.",
    "focusTarget": "ocean and storm clouds",
    "renderInstructions": "Camera: cliff top position, looking north at ocean horizon, wide shot, stormy natural light with dark clouds",
    "hasImage": false
  },
  "south": {
    "viewKey": "south",
    "looks": "The rocky coastline stretches south with jagged formations. A distant beach is barely visible between cliff faces. The path winds inland toward unseen destinations. Sparse vegetation clings to the rocks.",
    "focusTarget": "coastline and inland path",
    "renderInstructions": "Camera: cliff top position, looking south at coastline, wide shot, stormy natural light",
    "hasImage": false
  }
}

Now generate view descriptions for the provided location.`;
};
