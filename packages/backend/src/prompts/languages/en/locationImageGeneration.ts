/**
 * LEGACY: Location image generation for seed-based flow
 * Used by old LocationSpawnManager - kept for backward compatibility
 */

import { morfeumVibes, qualityPrompt } from './constants';

export const locationImageGeneration = (
  originalPrompt: string,
  name: string,
  looks: string,
  atmosphere: string,
  mood?: string,
  filterName?: string
): string => {
  // Simple location prompt using seed data
  const shotInstructions = {
    shot: 'elevated oblique 3/4 view, diagonal approach angle, foreground occlusion from natural elements, off-axis composition with cropped edges, layered depth',
    light: 'directional natural light with atmospheric haze, environmental motion (wind-blown mist, drifting clouds)'
  };
  
  return `${morfeumVibes}

Original user description: "${originalPrompt}"

${name}, ${shotInstructions.shot}.

[LIGHT:] ${shotInstructions.light}

[SCENE:]
Description: ${looks}.

Atmosphere: ${atmosphere}.

${mood ? `Mood: ${mood}.` : ''}

[WORLD RULES:] water calm and mirror-still

IMPORTANT: no humans or animals unless specified

${qualityPrompt}`;
};
