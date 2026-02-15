/**
 * LLM Scene Composer for Character-in-Environment Images
 * 
 * Takes a character's visual DNA and a location's original image prompt,
 * then uses an LLM to compose a cohesive scene prompt where the character
 * is genuinely part of the environment.
 * 
 * Supports multiple shot types and custom actions for flexible scene generation.
 */

import { AI_MODELS } from '../../../../config/constants';
import * as mzooService from '../../../../services/mzoo';

/**
 * Shot types for camera framing
 */
export type ShotType =
  | 'half_portrait'          // Face + upper body, background visible but soft
  | 'full_body'              // Full body visible, character in environment
  | 'environmental_portrait' // 30-40% character, 60-70% environment clearly visible
  | 'full_scene'             // Wide shot, character small in landscape (15-25%)
  | 'close_up'               // Face focus, minimal background
  | 'action_shot'            // Dynamic motion, character interacting
  | 'dramatic_low_angle'     // Power pose from below
  | 'aerial_overview'        // Bird's eye view
  | 'over_shoulder';         // From behind, looking at environment

// Backward compatibility alias
export type SceneComposition = ShotType;

export interface CharacterVisualData {
  name: string;
  looks: string;
  wearing: string;
  presence?: string;
  personality?: string;
}

export interface EnvironmentConditions {
  weather?: string;
  timeOfDay?: string;
}

/**
 * Shot type descriptions for the LLM
 */
const SHOT_TYPE_GUIDELINES: Record<ShotType, string> = {
  half_portrait: 'Half portrait - Subject facing the camera directly, steady eye contact; face in crisp focus; natural depth of field with gentle background bokeh; balanced or slightly off-center framing emphasizing eyes and expression; neutral or soft directional light enhancing skin texture.',
  full_body: 'Full body shot - Character visible head to toe (40-50% of frame). Standing or posed naturally in the environment. Environment clearly visible around them.',
  environmental_portrait: 'Environmental portrait - Character takes 30-40% of frame, environment clearly visible (60-70%). Mid to 3/4 shot showing character grounded in their surroundings.',
  full_scene: 'Wide establishing shot - Character is small part of landscape (15-25%), environment dominant. Character placed naturally within vast scenery.',
  close_up: 'Close-up portrait - Face fills most of frame (70%+). Sharp focus on eyes and expression. Background minimal, heavily blurred. Intimate and personal.',
  action_shot: 'Dynamic action shot - Character in motion or actively doing something. Movement implied through pose and composition. Energy and dynamism.',
  dramatic_low_angle: 'Low-angle dramatic shot - Camera below subject looking up. Character appears powerful, dominant. Sky or ceiling visible. Heroic framing.',
  aerial_overview: 'Aerial/bird\'s eye shot - Camera high above looking down. Character small in frame. Shows spatial context and environment layout.',
  over_shoulder: 'Over-the-shoulder shot - Camera behind character, showing what they see. Character partially visible (shoulder, back of head). Environment is the focus.'
};

const SCENE_COMPOSER_SYSTEM_PROMPT = `You are an expert at crafting image generation prompts that place characters INTO existing scenes.

Your task is to merge a CHARACTER DESCRIPTION with a LOCATION SCENE into ONE cohesive image prompt.

CRITICAL RULES:
1. The character must appear genuinely WITHIN the environment
2. Maintain the location's visual language (materials, colors, lighting, atmosphere)
3. Follow the specified SHOT TYPE exactly for camera framing
4. If an ACTION is specified, show the character performing that action naturally
5. Keep the artistic style consistent with the location
6. Specify the character's position and how they interact with the space
7. If ENVIRONMENT CONDITIONS are provided (weather, time of day), reflect them in lighting, shadows, atmosphere, and character appearance

SHOT TYPE GUIDELINES:
${Object.entries(SHOT_TYPE_GUIDELINES).map(([type, desc]) => `- ${type}: ${desc}`).join('\n')}

STRUCTURE YOUR OUTPUT:
1. Start with camera/composition direction based on shot type
2. Describe the environment visually (incorporating weather/time of day if provided)
3. Integrate the character INTO that scene
4. If action specified, describe the action naturally
5. End with atmosphere/mood that unifies everything (lighting should match time of day)

Output ONLY the final prompt. No explanations, no markdown, no quotes.`;

const buildUserPrompt = (
  character: CharacterVisualData,
  locationImagePrompt: string,
  shotType: ShotType,
  action?: string,
  environment?: EnvironmentConditions
): string => {
  let prompt = `CHARACTER DESCRIPTION:
Name: ${character.name}
Appearance: ${character.looks}
Clothing: ${character.wearing}
${character.presence ? `Presence/Aura: ${character.presence}` : ''}
${character.personality ? `Demeanor: ${character.personality}` : ''}

LOCATION SCENE (maintain its visual style):
${locationImagePrompt}`;

  // Add environment conditions if provided
  if (environment?.weather || environment?.timeOfDay) {
    prompt += `\n\nENVIRONMENT CONDITIONS:`;
    if (environment.timeOfDay) {
      prompt += `\nTime of Day: ${environment.timeOfDay.replace(/_/g, ' ')} - lighting and shadows must reflect this`;
    }
    if (environment.weather) {
      prompt += `\nWeather: ${environment.weather} - atmosphere and visibility must reflect this`;
    }
  }

  prompt += `\n\nSHOT TYPE: ${shotType}
${SHOT_TYPE_GUIDELINES[shotType]}`;

  if (action) {
    prompt += `\n\nACTION/POSE: ${action}
Show ${character.name} ${action}. Make this action look natural and integrated with the environment.`;
  }

  prompt += `\n\nCreate a single cohesive image prompt that shows ${character.name} in this environment with the specified shot type${action ? ` performing: ${action}` : ''}.`;

  return prompt;
};

/**
 * Compose a scene prompt that places a character into an environment
 * 
 * @param character - Character's visual data (looks, wearing, presence)
 * @param locationContext - The location's image prompt or environment DNA
 * @param shotType - How to frame the shot (camera angle/composition)
 * @param apiKey - MZOO API key
 * @param action - Optional action/pose for the character
 * @param environment - Optional environment conditions (weather, time of day) from host
 * @returns Optimized FLUX prompt with character integrated into scene
 */
export async function composeCharacterScenePrompt(
  character: CharacterVisualData,
  locationContext: string,
  shotType: ShotType,
  apiKey: string,
  action?: string,
  environment?: EnvironmentConditions
): Promise<string> {
  const userPrompt = buildUserPrompt(character, locationContext, shotType, action, environment);

  const result = await mzooService.generateText(
    apiKey,
    [
      { role: 'system', content: SCENE_COMPOSER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    AI_MODELS.SEED_GENERATION // Use fast model for prompt composition
  );

  if (result.error || !result.data?.text) {
    throw new Error(result.error || 'Failed to compose scene prompt');
  }

  return result.data.text.trim();
}

/**
 * Get default shot type for initial character creation
 * Uses half_portrait for character identity images
 */
export function getDefaultShotTypeForCharacterCreation(): ShotType {
  return 'half_portrait';
}

/**
 * Get all available shot types with descriptions
 * Useful for UI display or command help
 */
export function getAvailableShotTypes(): Array<{ type: ShotType; description: string }> {
  return Object.entries(SHOT_TYPE_GUIDELINES).map(([type, description]) => ({
    type: type as ShotType,
    description
  }));
}

/**
 * Parse natural language to extract shot type
 * Supports both explicit keywords and natural descriptions
 */
export function parseShotTypeFromText(text: string): ShotType | null {
  const lowerText = text.toLowerCase();
  
  // Direct matches
  const shotTypes = Object.keys(SHOT_TYPE_GUIDELINES) as ShotType[];
  for (const shotType of shotTypes) {
    if (lowerText.includes(shotType.replace(/_/g, ' ')) || lowerText.includes(shotType)) {
      return shotType;
    }
  }
  
  // Natural language patterns
  if (lowerText.includes('face') || lowerText.includes('close up') || lowerText.includes('closeup')) {
    return 'close_up';
  }
  if (lowerText.includes('full body') || lowerText.includes('head to toe') || lowerText.includes('standing')) {
    return 'full_body';
  }
  if (lowerText.includes('half') || lowerText.includes('upper body') || lowerText.includes('portrait')) {
    return 'half_portrait';
  }
  if (lowerText.includes('wide') || lowerText.includes('landscape') || lowerText.includes('establishing')) {
    return 'full_scene';
  }
  if (lowerText.includes('from below') || lowerText.includes('low angle') || lowerText.includes('heroic') || lowerText.includes('dramatic')) {
    return 'dramatic_low_angle';
  }
  if (lowerText.includes('above') || lowerText.includes('bird') || lowerText.includes('aerial') || lowerText.includes('overhead')) {
    return 'aerial_overview';
  }
  if (lowerText.includes('action') || lowerText.includes('dynamic') || lowerText.includes('motion')) {
    return 'action_shot';
  }
  if (lowerText.includes('behind') || lowerText.includes('shoulder') || lowerText.includes('back')) {
    return 'over_shoulder';
  }
  if (lowerText.includes('environment') || lowerText.includes('surroundings')) {
    return 'environmental_portrait';
  }
  
  return null;
}
