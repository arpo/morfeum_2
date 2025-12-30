/**
 * Element Analysis Utilities
 * Functions for analyzing and extracting elements from user prompts and dominant elements
 */

/**
 * Target element info extracted from dominant elements
 * Enhanced to support full interior seed data: orientation, openings, materials, atmosphere
 */
export interface TargetElementInfo {
  name: string;
  fullDescription: string;
  properties: string;
  shape?: string;
  orientation?: string;
  scale?: string;
  style?: string;
  surfaces?: string;
  openings?: string;
  interiorMaterials?: {
    walls?: string;
    floor?: string;
    ceiling?: string;
  };
  internalAtmosphere?: string;
}

/**
 * Find if user input references a dominant element in the current space
 * Parses dominant element strings like:
 * "alien ship: shape=organic, orientation=horizontal, scale=massive, style=futuristic, internal_atmosphere=dim-mystical"
 * 
 * @param userPrompt - User's input (e.g., "alien ship" or "the ship")
 * @param dominantElements - Array of dominant element strings from current node
 * @returns TargetElementInfo if match found, null otherwise
 */
export function findTargetElementInfo(userPrompt: string, dominantElements: unknown[]): TargetElementInfo | null {
  if (!dominantElements || dominantElements.length === 0) {
    return null;
  }

  const userPromptLower = userPrompt.toLowerCase();
  
  for (const element of dominantElements) {
    // Parse element format: string or structured object
    if (!element || (typeof element !== 'string' && typeof element !== 'object')) {
      continue;
    }

    let elementName = '';
    let propertiesStr = '';
    let shape: string | undefined;
    let orientation: string | undefined;
    let scale: string | undefined;
    let style: string | undefined;
    let surfaces: string | undefined;
    let openings: string | undefined;
    let interiorMaterials: { walls?: string; floor?: string; ceiling?: string } | undefined;
    let internalAtmosphere: string | undefined;

    if (typeof element === 'string') {
      const colonIndex = element.indexOf(':');
      elementName = colonIndex > 0 ? element.substring(0, colonIndex).trim() : element.trim();
      propertiesStr = colonIndex > 0 ? element.substring(colonIndex + 1).trim() : '';

      // Parse all properties from the enhanced format
      const shapeMatch = propertiesStr.match(/shape=([^,]+)/i);
      const orientationMatch = propertiesStr.match(/orientation=([^,]+)/i);
      const scaleMatch = propertiesStr.match(/scale=([^,]+)/i);
      const styleMatch = propertiesStr.match(/style=([^,]+)/i);
      const surfacesMatch = propertiesStr.match(/surfaces=([^,]+)/i);
      const openingsMatch = propertiesStr.match(/openings=([^,]+)/i);
      const interiorMaterialsMatch = propertiesStr.match(/interior_materials=([^,]+)/i);
      const atmosphereMatch = propertiesStr.match(/internal_atmosphere=([^,]+)/i);

      shape = shapeMatch ? shapeMatch[1].trim() : undefined;
      orientation = orientationMatch ? orientationMatch[1].trim() : undefined;
      scale = scaleMatch ? scaleMatch[1].trim() : undefined;
      style = styleMatch ? styleMatch[1].trim() : undefined;
      surfaces = surfacesMatch ? surfacesMatch[1].trim() : undefined;
      openings = openingsMatch ? openingsMatch[1].trim() : undefined;
      internalAtmosphere = atmosphereMatch ? atmosphereMatch[1].trim() : undefined;

      if (interiorMaterialsMatch) {
        const parts = interiorMaterialsMatch[1].trim().split('|');
        interiorMaterials = {
          walls: parts[0] || undefined,
          floor: parts[1] || undefined,
          ceiling: parts[2] || undefined
        };
      }
    } else {
      const elementObj = element as Record<string, unknown>;
      elementName = typeof elementObj.name === 'string' ? elementObj.name : '';
      shape = typeof elementObj.shape === 'string' ? elementObj.shape : undefined;
      orientation = typeof elementObj.orientation === 'string' ? elementObj.orientation : undefined;
      scale = typeof elementObj.scale === 'string' ? elementObj.scale : undefined;
      style = typeof elementObj.style === 'string' ? elementObj.style : undefined;
      surfaces = typeof elementObj.surfaces === 'string' ? elementObj.surfaces : undefined;
      openings = typeof elementObj.openings === 'string' ? elementObj.openings : undefined;

      const materialsRaw = (typeof elementObj.interior_materials === 'string'
        ? elementObj.interior_materials
        : typeof elementObj.interiorMaterials === 'string'
        ? elementObj.interiorMaterials
        : undefined) as string | undefined;
      if (materialsRaw) {
        const parts = materialsRaw.trim().split('|');
        interiorMaterials = {
          walls: parts[0] || undefined,
          floor: parts[1] || undefined,
          ceiling: parts[2] || undefined
        };
      }

      internalAtmosphere =
        typeof elementObj.internal_atmosphere === 'string'
          ? elementObj.internal_atmosphere
          : typeof elementObj.internalAtmosphere === 'string'
          ? elementObj.internalAtmosphere
          : undefined;

      const propertiesParts = [
        shape ? `shape=${shape}` : null,
        orientation ? `orientation=${orientation}` : null,
        scale ? `scale=${scale}` : null,
        style ? `style=${style}` : null,
        surfaces ? `surfaces=${surfaces}` : null,
        openings ? `openings=${openings}` : null,
        interiorMaterials
          ? `interior_materials=${[
              interiorMaterials.walls || '',
              interiorMaterials.floor || '',
              interiorMaterials.ceiling || ''
            ].join('|')}`
          : null,
        internalAtmosphere ? `internal_atmosphere=${internalAtmosphere}` : null
      ].filter(Boolean);
      propertiesStr = propertiesParts.join(', ');
    }

    if (!elementName) {
      continue;
    }

    const elementNameLower = elementName.toLowerCase();
    
    // Check if user prompt contains the element name (or vice versa)
    // "alien ship" matches "alien ship: shape=organic..."
    // "the ship" matches "alien ship: ..."
    // "ship" matches "alien ship: ..."
    const userWords = userPromptLower.split(/\s+/);
    const elementWords = elementNameLower.split(/\s+/);
    
    const hasMatch = 
      userPromptLower.includes(elementNameLower) || 
      elementNameLower.includes(userPromptLower) ||
      elementWords.some(word => userWords.includes(word) && word.length > 3);
    
    if (hasMatch) {
      return {
        name: elementName,
        fullDescription: typeof element === 'string' ? element : JSON.stringify(element),
        properties: propertiesStr || 'determine from context',
        shape,
        orientation,
        scale,
        style,
        surfaces,
        openings,
        interiorMaterials,
        internalAtmosphere
      };
    }
  }
  
  return null;
}

/**
 * Parse user input to extract required elements
 */
export function extractRequiredElements(userPrompt: string): string[] {
  const elements: string[] = [];
  
  const includeMatch = userPrompt.match(/include[:\s]+(.+?)(?:\.|$)/gi);
  if (includeMatch) {
    includeMatch.forEach(match => {
      const content = match.replace(/include[:\s]+/i, '').trim();
      elements.push(...content.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 0));
    });
  }
  
  const withMatches = userPrompt.match(/with (?:a |an |the )?([^,.]+)/gi);
  if (withMatches) {
    withMatches.forEach(match => {
      const item = match.replace(/^with (?:a |an |the )?/i, '').trim();
      if (item.length > 3 && item.length < 100) elements.push(item);
    });
  }
  
  return [...new Set(elements)];
}
