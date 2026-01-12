/**
 * V2 Image Prompt Generator
 * 
 * Uses LLM to generate structured image prompt JSON from node data and cascaded DNA.
 */

import { generateText } from '../../services/mzoo/services/textGeneration';
import type { Host, Region, WorldNode, DNA } from '../types';

/**
 * Structured image prompt layers
 */
export interface ImagePromptLayers {
  name: string;
  description: string;
  background: string;
  midground: string;
  foreground: string;
  lighting: string;
  atmosphere: string;
}

/**
 * Input for generating image prompt
 */
interface ImagePromptInput {
  nodeType: 'host' | 'region' | 'location';
  name: string;
  description: string;
  spaceType?: 'interior' | 'exterior';
  dna: DNA;
  hostName?: string;
  regionName?: string;
  /** Camera perspective guidance from centralized cameraSettings */
  perspectiveGuidance: string;
}

/**
 * Build the LLM prompt for generating image layers
 */
function buildImagePromptSystemMessage(input: ImagePromptInput): string {
  const { nodeType, name, description, spaceType, dna, hostName, regionName, perspectiveGuidance } = input;
  
  const contextLine = nodeType === 'host' 
    ? `World: ${name}`
    : nodeType === 'region'
    ? `Region: ${name} in ${hostName}`
    : `Location: ${name} in ${regionName}, ${hostName}`;

  return `You are an expert visual prompt engineer for AI image generation.

Generate a structured JSON image prompt for this ${nodeType}:

${contextLine}
Description: ${description}
Space Type: ${spaceType || 'exterior'}

${perspectiveGuidance}

Visual DNA:
- Visual Identity: ${dna.essence.join(', ') || 'Not specified'}
- Forms & Materials: ${dna.formsAndMaterials.join(', ') || 'Not specified'}
- Colors & Lighting: ${dna.colorAndLight.join(', ') || 'Not specified'}
- Atmosphere: ${dna.atmosphere.join(', ') || 'Not specified'}
- Banned Elements: ${dna.banned.join(', ') || 'None'}

Return ONLY valid JSON with these fields (no markdown, no explanation):
{
  "background": "Far layer appropriate for the camera perspective",
  "midground": "Middle layer appropriate for the camera perspective",
  "foreground": "Close layer appropriate for the camera perspective (for aerial: rooftops/terrain, NOT street-level)",
  "lighting": "Light quality, direction, color temperature, shadows specific to this scene",
  "atmosphere": "Mood, tone, atmospheric effects, emotional quality"
}

Make each field specific to "${name}" - not generic templates. Use the DNA to inform the visual details.
IMPORTANT: Match all layer descriptions to the camera perspective specified above.`;
}

/**
 * Parse LLM response to extract JSON
 */
function parseImagePromptResponse(response: string): Omit<ImagePromptLayers, 'name' | 'description'> | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ImagePromptGenerator] No JSON found in response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.background || !parsed.midground || !parsed.foreground || !parsed.lighting || !parsed.atmosphere) {
      console.error('[ImagePromptGenerator] Missing required fields in response');
      return null;
    }
    
    return {
      background: parsed.background,
      midground: parsed.midground,
      foreground: parsed.foreground,
      lighting: parsed.lighting,
      atmosphere: parsed.atmosphere
    };
  } catch (error) {
    console.error('[ImagePromptGenerator] Failed to parse response:', error);
    return null;
  }
}

/**
 * Generate image prompt layers using LLM
 */
export async function generateImagePromptLayers(
  apiKey: string,
  input: ImagePromptInput
): Promise<ImagePromptLayers> {
  const systemMessage = buildImagePromptSystemMessage(input);
  
  const result = await generateText(
    apiKey,
    [{ role: 'user', content: systemMessage }],
    'gemini-2.5-flash-lite'
  );
  
  if (result.error || !result.data?.text) {
    console.error('[ImagePromptGenerator] LLM call failed:', result.error);
    // Return fallback
    return createFallbackLayers(input);
  }
  
  const parsed = parseImagePromptResponse(result.data.text);
  if (!parsed) {
    return createFallbackLayers(input);
  }
  
  return {
    name: input.name,
    description: input.description,
    ...parsed
  };
}

/**
 * Create fallback layers if LLM fails
 */
function createFallbackLayers(input: ImagePromptInput): ImagePromptLayers {
  const { nodeType, name, description, dna } = input;
  
  return {
    name,
    description,
    background: nodeType === 'host' 
      ? 'Horizon, sky dome, atmospheric haze'
      : nodeType === 'region'
      ? 'Neighboring districts, distant skyline'
      : 'Sky, neighboring buildings',
    midground: nodeType === 'host'
      ? 'Landmarks, terrain, district boundaries'
      : nodeType === 'region'
      ? 'Streets, buildings, local landmarks'
      : 'Building facade, main entrance',
    foreground: nodeType === 'host'
      ? 'Terrain texture, road networks'
      : nodeType === 'region'
      ? 'Nearby rooftops, architectural details'
      : 'Street surface, environmental elements',
    lighting: dna.colorAndLight.join(', ') || 'Natural environmental lighting',
    atmosphere: dna.atmosphere.join(', ') || 'Atmospheric scene with depth'
  };
}

/**
 * Build final image prompt string from layers
 */
export function buildPromptFromLayers(
  layers: ImagePromptLayers,
  dna: DNA,
  cameraConfig: { composition: string; shot: string; lens: string; light: string },
  spaceType?: 'interior' | 'exterior'
): string {
  // Build NEG items: DNA banned + spaceType enforcement
  const negItems: string[] = [...dna.banned];
  
  // Add spaceType enforcement to prevent wrong scene type
  if (spaceType === 'exterior') {
    negItems.push('interior', 'indoor', 'inside room', 'indoor scene');
  } else if (spaceType === 'interior') {
    negItems.push('exterior', 'outdoor', 'building facade', 'street view');
  }
  
  const negLine = negItems.length > 0 ? `[NEG:] ${negItems.join(', ')}` : '';
  
  // Space type line with explicit emphasis
  const spaceTypeLine = spaceType 
    ? `[SPACE:] ${spaceType.toUpperCase()} - ${spaceType === 'exterior' ? 'OUTSIDE view of the building/location' : 'INSIDE the space'}`
    : '';
  
  return `${layers.name}. ${layers.description}

SCENE LAYERS:
- Background: ${layers.background}
- Midground: ${layers.midground}
- Foreground: ${layers.foreground}

LIGHTING: ${layers.lighting}
ATMOSPHERE: ${layers.atmosphere}

Visual Identity: ${dna.essence.join(', ')}
Forms & Materials: ${dna.formsAndMaterials.join(', ')}

${spaceTypeLine}
[CAMERA:] ${cameraConfig.shot}
[LENS:] ${cameraConfig.lens}
[LIGHT:] ${cameraConfig.light}

${negLine}`.trim();
}
