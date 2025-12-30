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
 * Also handles object format from older data structures
 */
export function parseDominantElement(elementStr: string | any): ParsedDominantElement | null {
  // Handle non-string inputs (e.g., objects from older data structures)
  if (typeof elementStr !== 'string') {
    // If it's an object, try to extract useful info
    if (elementStr && typeof elementStr === 'object') {
      return {
        name: elementStr.name || elementStr.type || String(elementStr),
        shape: elementStr.shape,
        orientation: elementStr.orientation,
        scale: elementStr.scale,
        style: elementStr.style,
        surfaces: elementStr.surfaces,
        openings: elementStr.openings
      };
    }
    return null;
  }
  
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
 * 
 * NOTE: This is for BUILDING windows showing the WORLD exterior.
 * For VEHICLES inside buildings, use buildImmediateSurroundingsConstraint instead.
 */
export function buildExteriorViewConstraint(genre: string, architecturalTone: string, paletteBias: string): string {
  // Build the constraint based on available info - emphasize what TO show
  let exteriorDescription = '';
  if (genre) {
    exteriorDescription += `${genre} environment`;
  }
  if (architecturalTone) {
    exteriorDescription += exteriorDescription ? ` with ${architecturalTone}` : architecturalTone;
  }
  
  // If we have no description, use a generic one
  if (!exteriorDescription) {
    exteriorDescription = 'the established world aesthetic';
  }
  
  // Build constraint that emphasizes what TO show, rather than hardcoding what to avoid
  // The exterior should match the world's DNA, whatever that may be
  return `[EXTERIOR VIEWS: Any windows, doors, or openings showing the OUTSIDE should display: ` +
    `${exteriorDescription}. ` +
    `${paletteBias ? `Colors visible outside: ${paletteBias}. ` : ''}` +
    `The exterior view should be CONSISTENT with the world's established aesthetic and genre.]`;
}

/**
 * Build a constraint for immediate surroundings visible through vehicle windows
 * This is for vehicles INSIDE buildings - shows the interior space, not world exterior
 * 
 * @param surroundingsName - Name of the surrounding space (e.g., "museum", "garage")
 * @param surroundingsDescription - Description of the space
 * @param surroundingsDNA - DNA of the surrounding space for visual details
 */
export function buildImmediateSurroundingsConstraint(
  surroundingsName: string,
  surroundingsDescription: string,
  surroundingsDNA: Record<string, any>
): string {
  // Extract visual details from surroundings DNA
  const looks = surroundingsDNA?.looks || '';
  const materials = surroundingsDNA?.materials || surroundingsDNA?.primary_surfaces || '';
  const lighting = surroundingsDNA?.colorsAndLighting || surroundingsDNA?.ambient || '';
  const atmosphere = surroundingsDNA?.atmosphere || '';
  
  // Build a description of what should be visible through vehicle windows
  let visibleElements: string[] = [];
  
  if (looks) {
    visibleElements.push(looks);
  }
  if (materials) {
    visibleElements.push(`Materials: ${materials}`);
  }
  if (lighting) {
    visibleElements.push(`Lighting: ${lighting}`);
  }
  
  const visualDescription = visibleElements.length > 0 
    ? visibleElements.join('. ')
    : surroundingsDescription || `the ${surroundingsName} interior`;
  
  return `[CRITICAL - VEHICLE SURROUNDINGS: This vehicle is INSIDE "${surroundingsName}". ` +
    `Through the windows/windshield, show the INTERIOR of ${surroundingsName}, NOT an outdoor street scene. ` +
    `Visible through windows: ${visualDescription}. ` +
    `${atmosphere ? `Atmosphere outside vehicle: ${atmosphere}. ` : ''}` +
    `DO NOT show outdoor streets, roads, or exterior city views - the vehicle is PARKED INDOORS.]`;
}
