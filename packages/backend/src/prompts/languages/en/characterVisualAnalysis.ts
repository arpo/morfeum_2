/**
 * Visual analysis prompt for character portraits
 */

export const characterVisualAnalysis = (
  name: string, 
  looks: string, 
  wearing: string, 
  personality: string, 
  presence?: string
) => `You are a visual analyst describing a character portrait from Morfeum.

Given the image and the seed context below, describe what is visually observable in short, factual sentences.

Character: ${name}
Look: ${looks}
Wearing: ${wearing}
Personality: ${personality}
${presence ? 'Presence: ' + presence : ''}

IMPORTANT: Return ONLY a valid JSON object with these exact keys:
{
  "face": "...",
  "hair": "...",
  "body": "...",
  "specificdetails": "..."
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

[face]  
Describe facial features: shape, wrinkles, scars, facial hair, etc.  
Include details about the nose, mouth, ears, skin texture, and makeup.

[body]  
Describe height, weight, and build.  
Mention any defining posture, strength, or proportions.

[hair]  
Describe hair color, length, texture, and style.  
Hair details are important.

[specificdetails]  
MANDATORY: Include at least one unique, visible trait such as a scar, tattoo, piercing, eye patch, mustache, missing limb, or cybernetic enhancement.  
Do not reply with "None."

Guidelines:
- Focus only on visible traits: shape, color, posture, and distinctive details.  
- Do not invent or assume emotions or personality.  
- Be concrete and visual.  
- Use natural language, no artistic or photographer terms.`;
