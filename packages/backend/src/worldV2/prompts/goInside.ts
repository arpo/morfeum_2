/**
 * GO_INSIDE2 Prompt
 * 
 * Generates container + space nodes when entering a new area.
 * Always creates 2 nodes:
 * 1. Container node (wrapper for the establishment/area being entered)
 * 2. Space node (the actual space you're now in - can be indoor OR outdoor)
 * 
 * Examples:
 * - "the restaurant" → Container: "The Restaurant", Space: "Restaurant Interior"
 * - "the park" → Container: "Central Park", Space: "Park Grounds" (outdoor)
 * - "the secret chamber" → Container: "Hidden Passage", Space: "Secret Chamber"
 */

import { DNA_SCHEMA, DNA_FIELD_RULES, DNA_DELTA_RULES } from './shared/dnaSchema';

/**
 * Space type for the entered area
 */
export type SpaceType = 'indoor' | 'outdoor' | 'semi-enclosed' | 'underground' | 'elevated';

/**
 * Container node structure
 */
export interface ContainerNode {
  id: string;
  type: 'container';
  name: string;
  slug: string;
  description: string;
  dna: {
    essence: string[];
    formsAndMaterials: string[];
    colorAndLight: string[];
    atmosphere: string[];
    banned: string[];
  };
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
  forbiddenTransformations: string[];
}

/**
 * Build the prompt for generating container + space nodes
 * 
 * @param target - What the user wants to enter (e.g., "the restaurant", "the park")
 * @param parentContext - Context about the parent location (name, description, DNA)
 * @returns The complete prompt for LLM
 */
export function buildGoInsidePrompt(
  target: string,
  parentContext: {
    name: string;
    description: string;
    effectiveDNA: {
      essence: string[];
      formsAndMaterials: string[];
      colorAndLight: string[];
      atmosphere: string[];
      banned: string[];
    };
  }
): string {
  return `You are a world-building assistant creating structured location data for a visual navigation system.

## CONTEXT
The user is currently at: "${parentContext.name}"
Description: ${parentContext.description}

Parent location DNA (style context to inherit from):
- Essence: ${parentContext.effectiveDNA.essence.join(', ')}
- Forms & Materials: ${parentContext.effectiveDNA.formsAndMaterials.join(', ')}
- Color & Light: ${parentContext.effectiveDNA.colorAndLight.join(', ')}
- Atmosphere: ${parentContext.effectiveDNA.atmosphere.join(', ')}
- Banned: ${parentContext.effectiveDNA.banned.join(', ')}

## USER REQUEST
The user wants to GO INSIDE: "${target}"

## YOUR TASK
Create TWO nodes:
1. **Container Node** - The wrapper/establishment being entered (e.g., "The Restaurant", "Central Park")
2. **Space Node** - The actual space the user is now in (e.g., "Main Dining Room", "Park Meadow")

## IMPORTANT RULES

### Space Type Detection
Determine the appropriate spaceType for the Space Node:
- "indoor" - Fully enclosed interior spaces (restaurants, houses, shops)
- "outdoor" - Open air spaces that you "enter" (parks, gardens, plazas within larger areas)
- "semi-enclosed" - Partially covered spaces (covered markets, pavilions, porches)
- "underground" - Below-ground spaces (caves, cellars, tunnels)
- "elevated" - Above-ground open spaces (rooftops, observation decks, tree platforms)

### DNA Rules
${DNA_FIELD_RULES}

${DNA_DELTA_RULES}
- Container DNA should capture the establishment's overall character
- Space DNA should capture the specific area's character (can differ from container)
- Both inherit from parent but can override with specific characteristics

### Forbidden Transformations
Generate 5-8 specific visual prohibitions for each node that would break consistency:
- Things that would cause genre drift
- Style elements that contradict the established aesthetic
- Anachronistic additions
- Material/lighting changes that would break immersion

## OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:

{
  "container": {
    "id": "__AUTO__",
    "type": "container",
    "name": "Descriptive name for the establishment/area",
    "slug": "kebab-case-slug",
    "description": "2-3 sentence description of this place as an establishment",
    ${DNA_SCHEMA},
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
    "forbiddenTransformations": ["prohibition 1", "prohibition 2", "..."]
  }
}

## EXAMPLES

For "the restaurant" from a town square:
- Container: "The Golden Anchor Tavern" (the establishment)
- Space: "Main Dining Hall" (where you actually are, indoor)

For "the park" from a city street:
- Container: "Riverside Park" (the park as a whole)
- Space: "Central Meadow" (the specific area you're in, outdoor)

For "the secret passage" from a library:
- Container: "Hidden Archive Entrance" (the passage system)
- Space: "Secret Document Vault" (where you emerge, underground)

Now generate the JSON for entering "${target}" from "${parentContext.name}":`;
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
  const container: ContainerNode = {
    id: generateId(),
    type: 'container',
    name: parsed.container.name,
    slug: parsed.container.slug,
    description: parsed.container.description,
    dna: {
      essence: parsed.container.dna?.essence || [],
      formsAndMaterials: parsed.container.dna?.formsAndMaterials || [],
      colorAndLight: parsed.container.dna?.colorAndLight || [],
      atmosphere: parsed.container.dna?.atmosphere || [],
      banned: parsed.container.dna?.banned || []
    },
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
    forbiddenTransformations: parsed.space.forbiddenTransformations || []
  };

  return { container, space };
}
