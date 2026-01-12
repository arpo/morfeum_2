/**
 * World Location Categorization Prompt
 * 
 * Parses a user concept into Host + Region + Location structure
 * Used by /NEW_WORLD_LOCATION command
 */

/**
 * Visual elements extracted from the concept
 */
export interface VisualElements {
  colors: string[];      // e.g., ["sandy orange-brown", "deep blue sky"]
  lighting: string;      // e.g., "clear, bright midday"
  atmosphere: string[];  // e.g., ["vast", "fantastical", "serene"]
  timeOfDay?: string;    // e.g., "midday", "sunset"
  weather?: string;      // e.g., "clear", "foggy"
}

/**
 * Result of categorizing a concept into world hierarchy
 */
export interface WorldLocationCategorization {
  host: {
    concept: string;
    name?: string;
  };
  region: {
    concept: string;
    name?: string;
  } | null; // null = pass-through region
  location: {
    concept: string;
  };
  visualElements: VisualElements;  // Extracted from full concept for consistency
}

/**
 * Build the prompt for categorizing a concept into host/region/location
 * @param concept - User's world concept description
 */
export function buildWorldLocationCategorizationPrompt(concept: string): string {
  return `Output ONE valid JSON object. No markdown, no comments.

Analyze the user's concept and split it into a 3-layer world hierarchy:
- Host: The world/setting (city, planet, realm, era)
- Region: The district/area within the host (neighborhood, biome, zone) - OR null for pass-through
- Location: The specific place (building, structure, site)
- Visual Elements: Colors, lighting, atmosphere extracted from the FULL description

{
  "host": { "concept": "...", "name": "..." },
  "region": { "concept": "...", "name": "..." } OR null,
  "location": { "concept": "..." },
  "visualElements": {
    "colors": ["color1", "color2", ...],
    "lighting": "lighting description",
    "atmosphere": ["mood1", "mood2"],
    "timeOfDay": "time" (optional),
    "weather": "weather" (optional)
  }
}

RULES:

1. PASS-THROUGH REGIONS (set region to null):
   Use null when the concept is GENERIC/UNDEFINED with no known geographic anchor:
   - "A steampunk factory" → null (generic, no city)
   - "A medieval castle" → null (generic era, no specific location)
   - "An alien building on a distant planet" → null (abstract sci-fi)
   - "A cozy Victorian cottage" → null (generic style, no place)

2. REAL REGIONS (create region object):
   Use when concept references a KNOWN place (real or established fictional):
   - "A pub in Camden in London" → region: { concept: "Camden", name: "Camden" }
   - "A hobbit hole in Middle-earth" → region: { concept: "The Shire", name: "The Shire" }
   - "A diner in Brooklyn" → region: { concept: "Brooklyn", name: "Brooklyn" }
   
3. HOST EXTRACTION:
   - For real places: Use the actual city/world name (e.g., "London", "Tokyo", "Middle-earth")
   - For generic concepts: Create an evocative world name that fits the tone
   - Keep host name clean - no embellishments unless user specifies

4. LOCATION EXTRACTION:
   - This is the SPECIFIC PLACE the user wants to see
   - Include all descriptive details from the concept
   - If multiple locations mentioned, pick the most prominent one

5. NON-LOCATION PROMPTS:
   If the input describes something OTHER than a location (e.g., a character, object, or abstract scene),
   you MUST still create a suitable location that would fit:
   - "A wizard with a long beard" → Location: a wizard's study or magical tower
   - "A cyberpunk hacker" → Location: a neon-lit apartment or underground tech den
   - "A pirate captain" → Location: ship's quarters or harbor tavern
   - "A scene of wonder" → Infer the most fitting location from context
   
   Always return a valid host/region/location structure - NEVER fail.

6. COMPLEX DESCRIPTIONS:
   For long, detailed descriptions (like image descriptions), extract:
   - Host: The overall world/setting/environment type
   - Region: Geographic anchor if any, otherwise null
   - Location: The main focal structure or place being described

7. VISUAL ELEMENTS:
   Extract colors, lighting, and atmosphere from the FULL original description.
   These will be used to ensure consistency across all nodes.
   - colors: Specific color mentions (e.g., "sandy orange-brown", "deep blue sky", "white structure")
   - lighting: How the scene is lit (e.g., "bright midday sun", "soft twilight", "harsh shadows")
   - atmosphere: ALL mood/style/feeling adjectives from the description. This is CRITICAL for consistency.
     Look for terms like: whimsical, fantastical, ethereal, surreal, otherworldly, serene, cozy, 
     mysterious, dreamlike, magical, futuristic, ancient, alien, organic, mechanical, elegant,
     gothic, romantic, dystopian, utopian, haunting, vibrant, melancholic, playful, majestic, etc.
     Extract EVERY descriptive adjective that describes the mood, style, or feeling.
   - timeOfDay: If mentioned or implied (e.g., "midday", "sunset", "night")
   - weather: If mentioned (e.g., "clear", "foggy", "overcast")

EXAMPLES:

Input: "a pub in Camden in London"
Output: {"host":{"concept":"London","name":"London"},"region":{"concept":"Camden","name":"Camden"},"location":{"concept":"a pub"},"visualElements":{"colors":["warm amber","dark wood","red brick"],"lighting":"warm interior lighting","atmosphere":["cozy","urban","traditional"]}}

Input: "A steampunk factory with brass pipes"
Output: {"host":{"concept":"A steampunk industrial world","name":"Brassworks"},"region":null,"location":{"concept":"A steampunk factory with brass pipes"},"visualElements":{"colors":["brass","copper","iron gray","steam white"],"lighting":"industrial ambient with warm metal reflections","atmosphere":["mechanical","industrial","retrofuturistic"]}}

Input: "A multi-tiered white structure over sandy desert with pink moon"
Output: {"host":{"concept":"A desert world with deep blue sky and pink celestial body","name":"The Amber Expanse"},"region":null,"location":{"concept":"A fantastical multi-tiered white structure with ornate geometric windows and colorful spires, with a winding staircase ascending from the desert floor"},"visualElements":{"colors":["sandy orange-brown","deep blue sky","white","pink celestial body"],"lighting":"bright midday sun with sharp shadows","atmosphere":["vast","otherworldly","serene"],"timeOfDay":"midday","weather":"clear"}}

Input: "A whimsical, futuristic spacecraft floating over an alien desert world"
Output: {"host":{"concept":"An alien desert world with surreal landscapes and organic structures","name":"Xylos"},"region":null,"location":{"concept":"A whimsical, futuristic spacecraft with ornate geometric windows, colorful spires, and dangling ornaments"},"visualElements":{"colors":["white","red","yellow","blue","green","sandy orange-brown","deep blue sky"],"lighting":"bright midday sun","atmosphere":["whimsical","futuristic","surreal","otherworldly","fantastical","alien","organic"],"timeOfDay":"midday","weather":"clear"}}

CONCEPT: ${concept}`;
}

/**
 * Parse the LLM response into WorldLocationCategorization
 */
export function parseWorldLocationCategorizationResponse(jsonString: string): WorldLocationCategorization {
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
  if (!parsed.host || !parsed.host.concept) {
    throw new Error('Missing required field: host.concept');
  }
  
  if (!parsed.location || !parsed.location.concept) {
    throw new Error('Missing required field: location.concept');
  }
  
  // Region can be null (pass-through) or an object
  if (parsed.region !== null && (!parsed.region.concept)) {
    throw new Error('Region must be null or have a concept field');
  }
  
  // Parse visual elements with defaults
  const visualElements: VisualElements = {
    colors: parsed.visualElements?.colors || [],
    lighting: parsed.visualElements?.lighting || 'natural ambient lighting',
    atmosphere: parsed.visualElements?.atmosphere || [],
    timeOfDay: parsed.visualElements?.timeOfDay || undefined,
    weather: parsed.visualElements?.weather || undefined
  };
  
  return {
    host: {
      concept: parsed.host.concept,
      name: parsed.host.name || undefined
    },
    region: parsed.region ? {
      concept: parsed.region.concept,
      name: parsed.region.name || undefined
    } : null,
    location: {
      concept: parsed.location.concept
    },
    visualElements
  };
}
