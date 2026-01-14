/**
 * GO_INSIDE2 Prompt
 * 
 * Generates container + space nodes when entering a new area.
 * Always creates 2 nodes:
 * 1. Container node (wrapper for the establishment/area being entered)
 * 2. Space node (the actual space you're now in - can be indoor OR outdoor)
 * 
 * Uses promptLayers for visual style preservation across navigation.
 * The source image's promptLayers are passed in, and the LLM generates
 * new promptLayers for the interior that inherits the visual signature.
 * 
 * CACHING: Static content is exported as GO_INSIDE_STATIC for use with
 * generateCachedText(). Dynamic content is built by goInsideDynamic().
 */

import { DNA_SCHEMA, DNA_FIELD_RULES, DNA_DELTA_RULES } from './shared/dnaSchema';
import type { ImagePromptLayers } from '../display/imagePromptGenerator';

/**
 * Space type for the entered area
 */
export type SpaceType = 'indoor' | 'outdoor' | 'semi-enclosed' | 'underground' | 'elevated';

/**
 * Container node structure
 * NOTE: Container has NO DNA - it's a pass-through node.
 * DNA cascades directly from parent location to space.
 */
export interface ContainerNode {
  id: string;
  type: 'container';
  name: string;
  slug: string;
  description: string;
  forbiddenTransformations: string[];
}

/**
 * Space node structure
 */
export interface SpaceNode {
  id: string;
  type: 'space';
  name: string;
  slug: string;
  description: string;
  spaceType: SpaceType;
  dna: {
    essence: string[];
    formsAndMaterials: string[];
    colorAndLight: string[];
    atmosphere: string[];
    banned: string[];
  };
  /** 
   * Visual style layers for the interior space
   * Inherits visual signature from source image and adapts for interior context
   * Used for image generation AND for future navigation from this space
   */
  promptLayers: {
    background: string;
    midground: string;
    foreground: string;
    lighting: string;
    atmosphere: string;
  };
  forbiddenTransformations: string[];
}

/**
 * Static content for GO_INSIDE2 prompt - CACHEABLE
 * Contains all rules, schemas, and output format that don't change per request.
 * ~1200 tokens - exported for use in morfeum-v2-navigation cache group.
 */
export const GO_INSIDE_STATIC = `You are a world-building assistant creating structured location data for a visual navigation system.

## YOUR TASK
Create TWO nodes:
1. **Container Node** - The wrapper/establishment being entered (e.g., "The Restaurant", "Central Park")
2. **Space Node** - The actual space the user is now in (e.g., "Main Dining Room", "Park Meadow")

## IMPORTANT RULES

### Space Type Detection (CRITICAL - Choose Carefully)
Determine the appropriate spaceType for the Space Node based on PHYSICAL characteristics:

- "indoor" - FULLY enclosed: solid walls AND solid ceiling, NO sky visible through any opening
  Examples: restaurants, bedrooms, shops, closed rooms, sealed chambers
  Key test: Can you see sky? NO → indoor

- "outdoor" - NO enclosure: open air, full sky visible, no roof at all
  Examples: park lawns, open plazas, beaches, clearings, fields
  Key test: Is there ANY roof/canopy? NO → outdoor

- "semi-enclosed" - PARTIAL enclosure: has SOME covering but sky visible through gaps, lattice, open sides, or partial roof
  Examples: pavilions, gazebos, pergolas, open-air temples, art installations with framework roofs, covered markets with skylights, structures with lattice/mesh roofs, canopied areas, arbors
  Key test: Is there a roof/framework but you can see sky through it? YES → semi-enclosed
  IMPORTANT: Large art installations, temple structures, and pavilion-type buildings are typically semi-enclosed, NOT indoor

- "underground" - Below ground level: surrounded by earth/rock, no natural sky access
  Examples: caves, cellars, basements, tunnels, grottos, catacombs
  Key test: Is it below ground? YES → underground

- "elevated" - Open-air raised platform: above ground level, no roof, open to sky
  Examples: balconies, rooftop terraces, observation decks, elevated walkways
  Key test: Is it raised AND has no roof? YES → elevated

### DNA Rules (for world-building context)
${DNA_FIELD_RULES}

${DNA_DELTA_RULES}

**Container and Space DNA:**
- Container: NO DNA - it's a pass-through node
- Space DNA: ONLY items that are NEW and DIFFERENT from parent
- Use EMPTY ARRAYS [] for fields that don't change

### Forbidden Transformations
Generate 5-8 specific visual prohibitions for each node that would break consistency.

### promptLayers (CRITICAL - Visual Style for Interior)
You MUST generate \`promptLayers\` that describe the interior space visually.

**The promptLayers should:**
1. **INHERIT** the visual signature from the source image (materials, palette, atmosphere tone)
2. **ADAPT** for the interior context:
   - For indoor/underground: No sky, indirect lighting, enclosed ceiling
   - For semi-enclosed: Filtered light, partial enclosure
   - For elevated/outdoor: Adapted perspective from within the space
3. **DESCRIBE** what the camera sees from INSIDE the space

**Key principles:**
- The same MATERIALS should appear on interior walls/surfaces
- The same COLOR PALETTE should be visible
- The same ATMOSPHERE TONE should be felt
- LIGHTING adapts from exterior to interior (direct sun → indirect/filtered)

### INTERIOR SPACE NAMING (CRITICAL - Avoid Edit Model Failures)
For INDOOR spaces, you MUST follow these naming rules to prevent visual confusion:

**DO NOT use these space types in names or descriptions:**
- "atrium" - implies a central void where you can see the structure
- "void" - implies emptiness with visible structure
- "shaft" - implies vertical opening
- "gallery" (in the vertical sense) - implies multi-level void
- Any space concept where "you can see the full height/structure from inside"

**INSTEAD, use these space types:**
- "chamber" - enclosed, carved-into-mass space
- "hall" - elongated enclosed space
- "room" - standard enclosed space
- "corridor" - passage carved through mass
- "vestibule" - entry chamber
- "salon" - refined enclosed space
- "gallery" (as exhibition space) - OK if describing walls with art, NOT a vertical void
- "anteroom" - waiting area before main space

**Why this matters:**
When the edit model sees "atrium" or "void" in the prompt, it renders the structure as visible from inside (the "tower inside tower" bug). The interior should feel CARVED INTO the mass, not a void CONTAINING the structure.

## OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:

{
  "container": {
    "id": "__AUTO__",
    "type": "container",
    "name": "Descriptive name for the establishment/area",
    "slug": "kebab-case-slug",
    "description": "2-3 sentence description of this place as an establishment",
    "forbiddenTransformations": ["prohibition 1", "prohibition 2", "..."]
  },
  "space": {
    "id": "__AUTO__",
    "type": "space",
    "name": "Descriptive name for the specific space",
    "slug": "kebab-case-slug",
    "description": "2-3 sentence description of this specific space and what you see",
    "spaceType": "indoor|outdoor|semi-enclosed|underground|elevated",
    ${DNA_SCHEMA},
    "promptLayers": {
      "background": "What's visible in the far layer of this interior space (walls, distant features, ceiling treatment)",
      "midground": "Main interior features at medium distance (furniture, passages, architectural elements)",
      "foreground": "Close elements and floor/surface details",
      "lighting": "How light behaves INSIDE this space (inherit source palette, adapt for enclosure)",
      "atmosphere": "Mood and feeling of the interior (inherit source tone, adapt for space type)"
    },
    "forbiddenTransformations": ["prohibition 1", "prohibition 2", "..."]
  }
}

## EXAMPLES

### Example 1: Rock-Hewn Tower (indoor)
**Source:** reddish-brown rock, harsh midday sun, barren desert
**Interior promptLayers:**
- background: "Reddish-brown carved rock walls stretching to a vaulted stone ceiling"
- midground: "Central carved passages and alcoves hewn from solid rock"
- foreground: "Smooth worn stone floor with ancient inscriptions"
- lighting: "Indirect filtered light from narrow slits, warm amber torchlight"
- atmosphere: "Ancient, enclosed, slightly cool desert sanctuary"

### Example 2: Victorian Pub (indoor)
**Source:** Victorian brick, warm amber lighting, gritty urban
**Interior promptLayers:**
- background: "Exposed brick walls with dark wood paneling"
- midground: "Long wooden bar, brass taps, hanging glasses"
- foreground: "Worn wooden floorboards, bar stools"
- lighting: "Warm amber glow from wall sconces and pendant lights"
- atmosphere: "Cozy, welcoming, traditional pub warmth"

### Example 3: Japanese Garden Pavilion (semi-enclosed)
**Source:** Traditional Japanese garden, paper screens, pine trees
**Interior promptLayers:**
- background: "Open lattice walls with garden views through shoji screens"
- midground: "Low wooden platform, tatami edges visible"
- foreground: "Polished dark wood decking, stepping stones below"
- lighting: "Dappled sunlight through lattice, soft diffused glow"
- atmosphere: "Tranquil, meditative, connection to nature preserved"

### Example 4: Rooftop Terrace (outdoor)
**Source:** Modern skyscraper, glass and steel, city skyline
**Interior promptLayers:**
- background: "City skyline visible, open sky above"
- midground: "Outdoor seating, potted plants, glass barriers"
- foreground: "Composite decking, urban garden elements"
- lighting: "Direct sunlight (preserve time of day), city ambient"
- atmosphere: "Urban retreat, elevated perspective, open air"

### Example 5: Underground Cave System (underground)
**Source:** Mountain entrance, moss-covered rocks, waterfall nearby
**Interior promptLayers:**
- background: "Natural rock walls disappearing into darkness, stalactites"
- midground: "Underground stream, rock formations, narrow passages"
- foreground: "Wet stone floor, phosphorescent moss patches"
- lighting: "Bioluminescent glow, no natural sky light"
- atmosphere: "Mysterious, ancient, isolated from surface world"

### SpaceType Decision Tree

1. Can you see the sky directly (no roof at all)?
   - YES → Is it raised/elevated? → YES = "elevated" / NO = "outdoor"
   - NO → Continue...

2. Is there a partial roof/canopy with gaps to sky?
   - YES → "semi-enclosed"
   - NO → Continue...

3. Is it below ground level?
   - YES → "underground"
   - NO → "indoor"

### Common Mistakes to Avoid

❌ Calling a gazebo "indoor" (it's semi-enclosed - has roof but open sides)
❌ Calling a covered market "indoor" (likely semi-enclosed if skylights/gaps exist)
❌ Calling a cave entrance "indoor" (it's underground)
❌ Calling a balcony "outdoor" (it's elevated - has no roof but is raised)
❌ Using "atrium" for indoor spaces (implies central void - use "hall" or "chamber")`;

/**
 * Build DYNAMIC content for GO_INSIDE2 prompt
 * Contains only the context-specific parts (parent location, target, promptLayers)
 * Used with generateCachedText() for efficient caching.
 * 
 * @param target - What the user wants to enter
 * @param parentContext - Context about the parent location
 * @returns Dynamic portion of the prompt
 */
export function goInsideDynamic(
  target: string,
  parentContext: {
    name: string;
    description: string;
    sourcePromptLayers: ImagePromptLayers;
  }
): string {
  const { sourcePromptLayers } = parentContext;
  
  return `## CONTEXT
The user is currently at: "${parentContext.name}"
Description: ${parentContext.description}

## SOURCE IMAGE VISUAL STYLE (CRITICAL - PRESERVE THIS)
The image you're editing shows this scene:

**Background:** ${sourcePromptLayers.background}

**Midground:** ${sourcePromptLayers.midground}

**Foreground:** ${sourcePromptLayers.foreground}

**Lighting:** ${sourcePromptLayers.lighting}

**Atmosphere:** ${sourcePromptLayers.atmosphere}

## USER REQUEST
The user wants to GO INSIDE: "${target}"

Now generate the JSON for entering "${target}" from "${parentContext.name}":`;
}

/**
 * Build the FULL prompt for generating container + space nodes
 * Legacy function - combines static + dynamic for non-cached usage
 * 
 * @param target - What the user wants to enter (e.g., "the restaurant", "the park")
 * @param parentContext - Context about the parent location (name, description, promptLayers)
 * @returns The complete prompt for LLM
 */
export function buildGoInsidePrompt(
  target: string,
  parentContext: {
    name: string;
    description: string;
    /** Source image's visual style - MUST be preserved */
    sourcePromptLayers: ImagePromptLayers;
  }
): string {
  // Combine static + dynamic for full prompt
  return `${GO_INSIDE_STATIC}

${goInsideDynamic(target, parentContext)}`;
}

/**
 * Parse the LLM response into container and space nodes
 * 
 * @param response - Raw LLM response text
 * @param generateId - Function to generate unique IDs
 * @returns Parsed container and space nodes
 */
export function parseGoInsideResponse(
  response: string,
  generateId: () => string
): { container: ContainerNode; space: SpaceNode } {
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = response;
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate and assign IDs
  // Container has NO DNA - it's a pass-through node
  const container: ContainerNode = {
    id: generateId(),
    type: 'container',
    name: parsed.container.name,
    slug: parsed.container.slug,
    description: parsed.container.description,
    forbiddenTransformations: parsed.container.forbiddenTransformations || []
  };

  const space: SpaceNode = {
    id: generateId(),
    type: 'space',
    name: parsed.space.name,
    slug: parsed.space.slug,
    description: parsed.space.description,
    spaceType: parsed.space.spaceType || 'indoor',
    dna: {
      essence: parsed.space.dna?.essence || [],
      formsAndMaterials: parsed.space.dna?.formsAndMaterials || [],
      colorAndLight: parsed.space.dna?.colorAndLight || [],
      atmosphere: parsed.space.dna?.atmosphere || [],
      banned: parsed.space.dna?.banned || []
    },
    promptLayers: {
      background: parsed.space.promptLayers?.background || 'Interior walls and ceiling',
      midground: parsed.space.promptLayers?.midground || 'Interior features and passages',
      foreground: parsed.space.promptLayers?.foreground || 'Floor and close surfaces',
      lighting: parsed.space.promptLayers?.lighting || 'Indirect ambient lighting',
      atmosphere: parsed.space.promptLayers?.atmosphere || 'Enclosed interior atmosphere'
    },
    forbiddenTransformations: parsed.space.forbiddenTransformations || []
  };

  return { container, space };
}
