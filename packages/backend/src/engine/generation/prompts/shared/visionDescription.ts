/**
 * Vision Description Prompt
 * Used to analyze images and create neutral descriptions for spawning entities
 */

/**
 * Static content for caching (~400 tokens)
 * This prompt is fully static - no dynamic content needed
 */
export const VISION_DESCRIPTION_STATIC = `You are analyzing an image to create a detailed description.

Analyze this image and provide a comprehensive description following these rules:

1. START with the appropriate prefix:
   - For portraits/characters: "A portrait of..."
   - For scenes/locations: "A scene of..."

2. IDENTIFY famous entities:
   - If this is a recognizable famous person, include their name (e.g., "A portrait of Albert Einstein...")
   - If this is a recognizable famous place, include its name (e.g., "A scene of the Eiffel Tower...")

3. DESCRIBE in detail:
   - For characters: facial features, hair color and style, clothing, expression, pose, distinctive traits, body type
   - For scenes: environment, lighting conditions, atmosphere, key elements, mood, time of day, weather

4. FORMAT: Write as a single flowing paragraph, natural language, no bullet points or JSON.

5. DO NOT describe the art style, medium, or technique. Do not mention if it's a photograph, illustration, painting, digital art, etc. Focus only on what is depicted, not how it was created.

Example outputs:
- "A portrait of a rugged warrior with battle scars across his face, short dark hair, muscular build, wearing worn leather armor with metal shoulder plates, intense brown eyes, standing in a defensive stance..."
- "A scene of a mystical forest at twilight with glowing fireflies scattered throughout, ancient twisted oak trees covered in moss, a winding cobblestone path leading to a distant cottage with warm light in the windows, mist rolling along the ground..."`;

/**
 * Legacy export - alias for backward compatibility
 */
export const visionDescriptionPrompt = VISION_DESCRIPTION_STATIC;
