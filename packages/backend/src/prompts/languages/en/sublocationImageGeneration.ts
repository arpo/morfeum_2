/**
 * Sublocation image generation prompt
 */
import { morfeumVibes, qualityPrompt } from './constants';

interface VisualAnchors {
  dominantElements?: string[];
  spatialLayout?: string;
  surfaceMaterialMap?: {
    primary_surfaces?: string;
    secondary_surfaces?: string;
    accent_features?: string;
  };
  colorMapping?: {
    dominant?: string;
    secondary?: string;
    accent?: string;
    ambient?: string;
  };
  uniqueIdentifiers?: string[];
}

export const sublocationImageGeneration = (
  name: string,
  looks: string,
  atmosphere: string,
  colorsAndLighting: string,
  mood?: string,
  materials?: string,
  sounds?: string,
  symbolicThemes?: string,
  visualAnchors?: VisualAnchors,
  genre?: string,
  architecturalTone?: string,
  palette?: string[],
  architecture?: string
) => {
  // Build visual anchors section if available
  let visualAnchorsSection = '';
  if (visualAnchors) {
    visualAnchorsSection = '\n[VISUAL ANCHORS:]';
    
    if (visualAnchors.dominantElements?.length) {
      visualAnchorsSection += `\nDominant Elements: ${visualAnchors.dominantElements.join(', ')}.`;
    }
    
    if (visualAnchors.spatialLayout) {
      visualAnchorsSection += `\nSpatial Layout: ${visualAnchors.spatialLayout}`;
    }
    
    if (visualAnchors.surfaceMaterialMap) {
      const map = visualAnchors.surfaceMaterialMap;
      visualAnchorsSection += '\nSurface Materials:';
      if (map.primary_surfaces) visualAnchorsSection += `\n  - Primary: ${map.primary_surfaces}`;
      if (map.secondary_surfaces) visualAnchorsSection += `\n  - Secondary: ${map.secondary_surfaces}`;
      if (map.accent_features) visualAnchorsSection += `\n  - Accents: ${map.accent_features}`;
    }
    
    if (visualAnchors.colorMapping) {
      const colors = visualAnchors.colorMapping;
      visualAnchorsSection += '\nColor Placement:';
      if (colors.dominant) visualAnchorsSection += `\n  - Dominant: ${colors.dominant}`;
      if (colors.secondary) visualAnchorsSection += `\n  - Secondary: ${colors.secondary}`;
      if (colors.accent) visualAnchorsSection += `\n  - Accent: ${colors.accent}`;
      if (colors.ambient) visualAnchorsSection += `\n  - Ambient: ${colors.ambient}`;
    }
    
    if (visualAnchors.uniqueIdentifiers?.length) {
      visualAnchorsSection += `\nUnique Identifiers: ${visualAnchors.uniqueIdentifiers.join(', ')}.`;
    }
  }

  // Build world context section
  let worldContextSection = '';
  if (genre || architecturalTone || palette || architecture) {
    worldContextSection = '\n[WORLD CONTEXT:]';
    if (genre) worldContextSection += `\nGenre: ${genre}.`;
    if (architecturalTone) worldContextSection += `\nArchitectural Tone: ${architecturalTone}.`;
    if (architecture) worldContextSection += `\nArchitecture Style: ${architecture}.`;
    if (palette?.length) worldContextSection += `\nColor Palette: ${palette.join(', ')}.`;
  }

  return `${morfeumVibes}

${name}.

Visual details: ${looks}.

Colors and Lighting: ${colorsAndLighting}.

Atmosphere: ${atmosphere}.

${mood ? 'Mood: ' + mood + '.' : ''}

${materials ? 'Materials: ' + materials + '.' : ''}

${sounds ? 'Soundscape: ' + sounds + '.' : ''}

${symbolicThemes ? 'Symbolic Themes: ' + symbolicThemes + '.' : ''}
${visualAnchorsSection}
${worldContextSection}

Guidelines:
- Focus on the location itself, avoid including people or animals if not specified in the original prompt.
- Use rich, evocative language to bring the scene to life.
- Avoid generic terms; be specific and concrete in descriptions.
- Ensure the scene is coherent and visually engaging.
- Pay close attention to visual anchors for spatial positioning and material details.

[WORLD RULES:]
No human or animal figures appear unless explicitly mentioned.
Water, when visible, is calm and mirror-still, reflecting light softly.


${qualityPrompt}`;
};
