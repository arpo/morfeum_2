/**
 * Vision Description Prompt
 * Used to analyze images and create descriptions + visual elements for spawning entities
 * 
 * Output is used by:
 * - entityType → determines which spawn command to use
 * - spaceType → determines exterior vs interior (for locations)
 * - visualElements → passed as "style lock" constraints for DNA generation
 */

/**
 * Entity types that can be detected from an image
 */
export type EntityType = 'location' | 'character' | 'prop';

/**
 * Result interface for the vision description analysis
 */
export interface VisionDescriptionResult {
  entityType: EntityType;
  description: string;
  spaceType: 'exterior' | 'interior';
  visualElements: {
    colors: string[];
    lighting: string;
    atmosphere: string[];
    timeOfDay?: string;
    weather?: string;
  };
}

/**
 * Static content for caching (~700 tokens)
 * This prompt is fully static - no dynamic content needed
 */
export const VISION_DESCRIPTION_STATIC = `You are analyzing an image to create a detailed description and extract visual elements.

Output ONE valid JSON object. No markdown, no comments.

{
  "entityType": "location",
  "description": "A scene of...",
  "spaceType": "exterior",
  "visualElements": {
    "colors": ["color1", "color2", ...],
    "lighting": "description of lighting",
    "atmosphere": ["mood1", "mood2", ...],
    "timeOfDay": "midday",
    "weather": "clear"
  }
}

=== ENTITY TYPE ===

Determine what type of entity is the PRIMARY subject of the image:

- "location": Scenes, environments, landscapes, buildings, rooms, places
- "character": Portraits, people, humanoids, creatures with personality
- "prop": Isolated objects, items, artifacts, vehicles (not part of a scene)

Rules:
- If image shows a person/character as the main subject → "character"
- If image shows an environment/place → "location"
- If image shows an isolated object with neutral background → "prop"
- When in doubt between character-in-scene vs scene-with-character, focus on what the image emphasizes

=== DESCRIPTION RULES ===

1. START with the appropriate prefix based on entityType:
   - For characters: "A portrait of..."
   - For locations: "A scene of..."
   - For props: "An object..."

2. IDENTIFY famous entities:
   - If this is a recognizable famous person, include their name (e.g., "A portrait of Albert Einstein...")
   - If this is a recognizable famous place, include its name (e.g., "A scene of the Eiffel Tower...")

3. DESCRIBE in detail:
   - For characters: facial features, hair color and style, clothing, expression, pose, distinctive traits, body type
   - For locations: environment, lighting conditions, atmosphere, key elements, mood, time of day, weather
   - For props: shape, materials, colors, details, condition, notable features

4. FORMAT: Write as a single flowing paragraph, natural language.

5. DO NOT describe the art style, medium, or technique. Focus only on what is depicted.

=== SPACE TYPE ===

- "exterior": Outdoor scenes, landscapes, cityscapes, open environments, outside buildings
- "interior": Indoor scenes, rooms, enclosed spaces, inside buildings/vehicles
- For characters/props, use the space type of their background/environment

=== VISUAL ELEMENTS (for style lock) ===

These are used to ensure visual consistency when generating related images:

- colors: Specific colors visible in the image (e.g., "deep blue sky", "sandy orange-brown", "white", "red", "golden")
- lighting: How the scene is lit (e.g., "bright midday sun", "soft twilight", "warm golden hour light", "harsh shadows")
- atmosphere: ALL mood/style/feeling adjectives that describe the image:
  whimsical, fantastical, ethereal, surreal, otherworldly, serene, cozy, mysterious, dreamlike, 
  magical, futuristic, ancient, alien, organic, mechanical, elegant, gothic, romantic, dystopian, 
  utopian, haunting, vibrant, melancholic, playful, majestic, ominous, peaceful, chaotic, etc.
  Extract EVERY adjective that captures the mood/style/feel.
- timeOfDay: One of: pre_dawn, dawn, morning, midday, afternoon, golden_hour, sunset, dusk, night, midnight
- weather: One of: clear, foggy, rainy, overcast, stormy, snowy, misty, hazy (or descriptive like "overcast with light drizzle")

=== EXAMPLES ===

Character example:
{
  "entityType": "character",
  "description": "A portrait of a rugged warrior with battle scars across his face, short dark hair, muscular build, wearing worn leather armor with metal shoulder plates, intense brown eyes, standing in a defensive stance.",
  "spaceType": "exterior",
  "visualElements": {
    "colors": ["brown", "dark gray", "weathered leather", "metallic silver"],
    "lighting": "dramatic side lighting with harsh shadows",
    "atmosphere": ["rugged", "intense", "battle-worn", "stoic"],
    "timeOfDay": "afternoon",
    "weather": "overcast"
  }
}

Location example:
{
  "entityType": "location",
  "description": "A scene of a mystical forest at twilight with glowing fireflies scattered throughout, ancient twisted oak trees covered in moss, a winding cobblestone path leading to a distant cottage with warm light in the windows, mist rolling along the ground.",
  "spaceType": "exterior",
  "visualElements": {
    "colors": ["deep purple sky", "warm amber glow", "moss green", "twilight blue", "soft yellow lights"],
    "lighting": "soft twilight with bioluminescent glow from fireflies",
    "atmosphere": ["mystical", "ethereal", "enchanting", "serene", "magical"],
    "timeOfDay": "dusk",
    "weather": "misty"
  }
}

Interior location example:
{
  "entityType": "location",
  "description": "A scene of a grand Victorian library with floor-to-ceiling mahogany bookshelves, leather armchairs arranged around a crackling fireplace, ornate brass lamps casting warm pools of light, and tall windows with heavy velvet drapes.",
  "spaceType": "interior",
  "visualElements": {
    "colors": ["rich mahogany", "deep burgundy", "warm brass", "cream paper", "forest green velvet"],
    "lighting": "warm firelight mixed with soft lamp glow",
    "atmosphere": ["elegant", "scholarly", "cozy", "refined", "traditional"],
    "timeOfDay": "night",
    "weather": "clear"
  }
}

Prop example:
{
  "entityType": "prop",
  "description": "An object depicting an ornate medieval sword with a jewel-encrusted golden hilt, long silver blade with runic engravings along its length, leather-wrapped grip, and a circular pommel featuring a carved lion's head.",
  "spaceType": "interior",
  "visualElements": {
    "colors": ["silver steel", "golden brass", "ruby red", "emerald green", "dark leather"],
    "lighting": "soft studio lighting with subtle reflections",
    "atmosphere": ["regal", "ancient", "powerful", "ornate"],
    "timeOfDay": "midday",
    "weather": "clear"
  }
}`;

/**
 * Legacy export - alias for backward compatibility
 */
export const visionDescriptionPrompt = VISION_DESCRIPTION_STATIC;

/**
 * Parse the LLM response into VisionDescriptionResult
 */
export function parseVisionDescriptionResponse(jsonString: string): VisionDescriptionResult {
  // Clean the response - remove markdown code blocks if present
  let cleaned = jsonString.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  const parsed = JSON.parse(cleaned);
  
  // Validate required fields
  if (!parsed.description || typeof parsed.description !== 'string') {
    throw new Error('Missing required field: description');
  }
  
  // Validate and normalize entityType
  const validEntityTypes: EntityType[] = ['location', 'character', 'prop'];
  let entityType: EntityType = 'location'; // Default
  if (validEntityTypes.includes(parsed.entityType)) {
    entityType = parsed.entityType;
  } else {
    // Infer from description prefix
    if (parsed.description.toLowerCase().startsWith('a portrait')) {
      entityType = 'character';
    } else if (parsed.description.toLowerCase().startsWith('an object')) {
      entityType = 'prop';
    }
  }
  
  // Validate and normalize spaceType
  if (parsed.spaceType !== 'exterior' && parsed.spaceType !== 'interior') {
    parsed.spaceType = 'exterior'; // Default to exterior if invalid
  }
  
  // Parse visual elements with defaults
  const visualElements = {
    colors: Array.isArray(parsed.visualElements?.colors) ? parsed.visualElements.colors : [],
    lighting: parsed.visualElements?.lighting || 'natural ambient lighting',
    atmosphere: Array.isArray(parsed.visualElements?.atmosphere) ? parsed.visualElements.atmosphere : [],
    timeOfDay: parsed.visualElements?.timeOfDay || undefined,
    weather: parsed.visualElements?.weather || undefined
  };
  
  return {
    entityType,
    description: parsed.description,
    spaceType: parsed.spaceType,
    visualElements
  };
}
