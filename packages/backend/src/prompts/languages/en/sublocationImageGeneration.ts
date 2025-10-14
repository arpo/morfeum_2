/**
 * Sublocation (interior) image generation prompt
 * Adapted from locationImageGeneration.ts for interior spaces
 */
import { morfeumVibes, qualityPrompt } from './constants';

export const sublocationImageGeneration = (
  name: string,
  looks: string,
  atmosphere: string,
  colorsAndLighting: string,
  mood?: string,
  viewContext?: {
    perspective: string;
    focusTarget: string;
    distance: string;
    composition: string;
  }
) => {
  // Interior-focused composition
  const compositionDirective = viewContext?.composition || 'interior view from entry point, eye-level perspective';

  return `${morfeumVibes}

${name}, ${compositionDirective}.

Interior visual details: ${looks}.

Colors and Lighting: ${colorsAndLighting}.

Atmosphere: ${atmosphere}.

${mood ? 'Mood: ' + mood + '.' : ''}

Guidelines:
- This is an interior space - focus on architectural details, fixtures, and ambient lighting.
- Capture the spatial layout and depth of the room.
- Show texture and materials of walls, floors, ceiling.
- Include lighting sources and how light interacts with surfaces.
- Avoid including people unless they are explicitly part of the scene's purpose.
- Use rich, evocative language to convey the interior atmosphere.
- Be specific about materials, colors, and spatial relationships.

IMPORTANT:
- Interior perspective: viewer is inside the space, not looking at it from outside.
- Show architectural elements like stairs, doorways, windows if present.
- Emphasize the enclosed nature and spatial qualities of the interior.
- Don't add figures or people unless explicitly required for the scene's context.

${qualityPrompt}`;
};
