/**
 * Helper functions for image prompt generation
 * Extracted from imagePromptGeneration.ts for file size compliance
 */

/**
 * Parsed dominant element with visual properties
 */
export interface ParsedDominantElement {
  name: string;
  shape?: string;
  orientation?: string;
  scale?: string;
  style?: string;
  surfaces?: string;
  openings?: string;
}

/**
 * Non-rectangular shapes that need direct FLUX constraints
 * FLUX tends to default to rectangular buildings, so we need to explicitly enforce these
 */
export const NON_RECTANGULAR_SHAPES = [
  'organic', 'round', 'circular', 'spherical', 'domed', 'cylindrical', 
  'oval', 'curved', 'blob', 'amorphous', 'pod', 'egg', 'capsule'
];

/**
 * Parse a dominant element string to extract visual properties
 * Format: "name: shape=X, orientation=Y, scale=Z, style=W, surfaces=S, openings=O, ..."
 */
export function parseDominantElement(elementStr: string): ParsedDominantElement | null {
  // Match "name: key=value, key=value, ..." format
  const match = elementStr.match(/^([^:]+):\s*(.+)$/);
  if (!match) {
    return { name: elementStr.trim() };
  }
  
  const name = match[1].trim();
  const propsStr = match[2];
  
  const result: ParsedDominantElement = { name };
  
  // Extract key=value pairs
  const propRegex = /(\w+)=([^,]+)/g;
  let propMatch;
  while ((propMatch = propRegex.exec(propsStr)) !== null) {
    const key = propMatch[1].toLowerCase();
    const value = propMatch[2].trim();
    if (['shape', 'orientation', 'scale', 'style', 'surfaces', 'openings'].includes(key)) {
      result[key as keyof Omit<ParsedDominantElement, 'name'>] = value;
    }
  }
  
  return result;
}

/**
 * Build a visually-emphasized description of dominant elements for the image prompt
 * Extracts and highlights shape, style, and surface info for key structures
 */
export function buildDominantElementsContext(dominantElements: string[]): string {
  if (!dominantElements || dominantElements.length === 0) {
    return '';
  }
  
  const parsed = dominantElements.map(parseDominantElement).filter(Boolean);
  
  if (parsed.length === 0) {
    return `Dominant Elements: ${dominantElements.join(', ')}`;
  }
  
  // Build enhanced visual descriptions
  const descriptions = parsed.map(el => {
    if (!el) return '';
    
    const parts: string[] = [`"${el.name}"`];
    
    if (el.shape) {
      // Emphasize non-rectangular shapes
      if (el.shape !== 'rectangular') {
        parts.push(`SHAPE=${el.shape.toUpperCase()} (NOT rectangular - must show ${el.shape} form)`);
      } else {
        parts.push(`shape=${el.shape}`);
      }
    }
    
    if (el.style) parts.push(`style=${el.style}`);
    if (el.surfaces) parts.push(`surfaces=${el.surfaces}`);
    if (el.scale) parts.push(`scale=${el.scale}`);
    if (el.orientation) parts.push(`orientation=${el.orientation}`);
    
    return parts.join(', ');
  });
  
  return `\n=== KEY STRUCTURES TO VISUALIZE ===\n${descriptions.join('\n')}\n\nCRITICAL: If shape is ORGANIC, ROUND, SPHERICAL, or DOMED - the structure MUST appear curved/organic, NOT rectangular.\n`;
}

/**
 * Build direct FLUX constraints for non-rectangular dominant elements
 * This bypasses the LLM and tells FLUX directly to render curved shapes
 */
export function buildShapeConstraints(dominantElements: string[]): string {
  if (!dominantElements || dominantElements.length === 0) {
    return '';
  }
  
  const constraints: string[] = [];
  
  for (const elementStr of dominantElements) {
    const parsed = parseDominantElement(elementStr);
    if (!parsed || !parsed.shape) continue;
    
    const shapeLower = parsed.shape.toLowerCase();
    const isNonRectangular = NON_RECTANGULAR_SHAPES.some(s => shapeLower.includes(s));
    
    if (isNonRectangular) {
      constraints.push(
        `[CRITICAL SHAPE: The "${parsed.name}" has ${parsed.shape.toUpperCase()} shape - ` +
        `it MUST appear with CURVED/ROUNDED form, NOT rectangular walls or sharp corners. ` +
        `Show organic, flowing curves appropriate for a ${parsed.shape} structure.]`
      );
    }
  }
  
  return constraints.join('\n');
}

/**
 * Build a direct FLUX constraint for exterior views through windows/openings
 * This ensures the world DNA is reflected in what's visible outside
 */
export function buildExteriorViewConstraint(genre: string, architecturalTone: string, paletteBias: string): string {
  const genreUpper = genre.toUpperCase();
  
  // Build the constraint based on available info
  let exteriorDescription = '';
  if (genre) {
    exteriorDescription += `${genre} environment`;
  }
  if (architecturalTone) {
    exteriorDescription += exteriorDescription ? ` with ${architecturalTone}` : architecturalTone;
  }
  
  // Build list of things to avoid based on genre
  let avoidList = 'green forests, lush vegetation, pastoral meadows, idyllic countryside';
  
  // Add genre-specific avoidance
  if (genre.toLowerCase().includes('apocaly') || genre.toLowerCase().includes('wasteland')) {
    avoidList = 'green forests, lush vegetation, blue sunny skies, pastoral scenes, healthy trees, green grass';
  } else if (genre.toLowerCase().includes('urban') || genre.toLowerCase().includes('industrial')) {
    avoidList = 'natural forests, countryside, pastoral scenes, wilderness';
  }
  
  return `[CRITICAL EXTERIOR VIEWS: Any windows, doors, or openings showing the OUTSIDE must display: ` +
    `${exteriorDescription}. ` +
    `${paletteBias ? `Colors visible outside: ${paletteBias}. ` : ''}` +
    `DO NOT show through windows: ${avoidList}. ` +
    `The exterior MUST match the world's ${genreUpper || 'established'} aesthetic, NOT generic nature.]`;
}
