/**
 * Enhancement Parser
 * Parses navigable elements, furnishing, facade details, and perspective flags from command text
 * 
 * Format examples:
 * - "navigable elements: door left wall, window front wall"
 * - "furnish: jacuzzi, spa chairs, potted palms"
 * - "facade: glass storefront, striped awning"
 * - "--interior" or "--exterior" or "--open-air" (perspective flags)
 */

import type { NavigableElement, ScenePerspective } from '../types';
import type { CreatureMode } from '../../generation/shared/imagePromptTypes';

export interface ParsedEnhancements {
  /** Parsed navigable elements from command */
  navigableElements?: NavigableElement[];
  /** Parsed furnishing items from command */
  furnishing?: string[];
  /** Parsed facade details for exteriors */
  facade?: string;
  /** User-specified perspective override (--interior, --exterior, --open-air) */
  perspectiveOverride?: ScenePerspective;
  /** 
   * Break DNA inheritance (--break flag)
   * When true, the new space can completely differ from parent world DNA
   * Use for portals, dimensional shifts, or intentionally contrasting spaces
   */
  breakInheritance?: boolean;
  /**
   * Creature mode for image generation (--populate, --people flags)
   * - 'populate': Add crowd/busy scene with people
   * - 'allow': Allow people without active crowd
   * - 'none': No people (default)
   */
  creatureMode?: CreatureMode;
  /** Clean command text with enhancement sections removed */
  cleanCommand: string;
}

/** Valid navigable element types */
const VALID_ELEMENT_TYPES = [
  'door', 'passage', 'corridor', 'stairs', 'ladder', 'ramp', 
  'platform', 'walkway', 'opening', 'hatch', 'archway', 'window', 'object'
] as const;

type ValidElementType = typeof VALID_ELEMENT_TYPES[number];

/**
 * Parse enhancements from a command string
 * 
 * @param commandText - Full command text including enhancement sections
 * @returns Parsed enhancements and clean command
 */
export function parseEnhancements(commandText: string): ParsedEnhancements {
  const result: ParsedEnhancements = {
    cleanCommand: commandText
  };

  // Extract and remove perspective flags (--interior, --exterior, --open-air)
  const perspectiveMatch = commandText.match(/\s*--(interior|exterior|open-air)\b/i);
  if (perspectiveMatch) {
    result.perspectiveOverride = perspectiveMatch[1].toLowerCase() as ScenePerspective;
    result.cleanCommand = result.cleanCommand.replace(perspectiveMatch[0], '');
  }

  // Extract and remove --break flag (disables DNA inheritance)
  const breakMatch = result.cleanCommand.match(/\s*--break\b/i);
  if (breakMatch) {
    result.breakInheritance = true;
    result.cleanCommand = result.cleanCommand.replace(breakMatch[0], '');
  }

  // Extract and remove creature mode flags (--populate, --people)
  const populateMatch = result.cleanCommand.match(/\s*--populate\b/i);
  if (populateMatch) {
    result.creatureMode = 'populate';
    result.cleanCommand = result.cleanCommand.replace(populateMatch[0], '');
  } else {
    const peopleMatch = result.cleanCommand.match(/\s*--people\b/i);
    if (peopleMatch) {
      result.creatureMode = 'allow';
      result.cleanCommand = result.cleanCommand.replace(peopleMatch[0], '');
    }
  }

  // Extract and remove "navigable elements:" section
  const navMatch = commandText.match(/,?\s*navigable elements?:\s*([^,]+(?:,\s*[^,]+)*?)(?=,\s*(?:furnish|facade):|$)/i);
  if (navMatch) {
    result.navigableElements = parseNavigableElements(navMatch[1]);
    result.cleanCommand = result.cleanCommand.replace(navMatch[0], '');
  }

  // Extract and remove "furnish:" section
  const furnishMatch = commandText.match(/,?\s*furnish:\s*([^,]+(?:,\s*[^,]+)*?)(?=,\s*(?:navigable|facade):|$)/i);
  if (furnishMatch) {
    result.furnishing = parseFurnishing(furnishMatch[1]);
    result.cleanCommand = result.cleanCommand.replace(furnishMatch[0], '');
  }

  // Extract and remove "facade:" section
  const facadeMatch = commandText.match(/,?\s*facade:\s*(.+?)(?=,\s*(?:navigable|furnish):|$)/i);
  if (facadeMatch) {
    result.facade = facadeMatch[1].trim();
    result.cleanCommand = result.cleanCommand.replace(facadeMatch[0], '');
  }

  // Clean up the command text
  result.cleanCommand = result.cleanCommand.trim().replace(/,\s*$/, '').trim();

  return result;
}

/**
 * Parse navigable elements from a comma-separated string
 * 
 * @example "door left wall, window front wall with view, archway right leading to hallway"
 */
function parseNavigableElements(elementsText: string): NavigableElement[] {
  const elements: NavigableElement[] = [];
  const parts = elementsText.split(',').map(s => s.trim()).filter(s => s.length > 0);

  for (const part of parts) {
    const element = parseOneNavigableElement(part);
    if (element) {
      elements.push(element);
    }
  }

  return elements;
}

/**
 * Parse a single navigable element description
 * 
 * @example "door left wall" -> { type: 'door', position: 'left wall', description: 'door on left wall' }
 * @example "window front wall with garden view" -> { type: 'window', position: 'front wall', description: 'window with garden view' }
 */
function parseOneNavigableElement(text: string): NavigableElement | null {
  const lower = text.toLowerCase();
  
  // Try to find a valid element type at the start
  let foundType: ValidElementType | null = null;
  let restOfText = text;

  for (const type of VALID_ELEMENT_TYPES) {
    if (lower.startsWith(type + ' ') || lower === type) {
      foundType = type;
      restOfText = text.slice(type.length).trim();
      break;
    }
  }

  // If no type found at start, try to find it anywhere in the text
  if (!foundType) {
    for (const type of VALID_ELEMENT_TYPES) {
      if (lower.includes(type)) {
        foundType = type;
        // Remove the type from the text for position/description
        restOfText = text.replace(new RegExp(type, 'i'), '').trim();
        break;
      }
    }
  }

  // Default to 'object' if still no type found
  if (!foundType) {
    foundType = 'object';
  }

  // Parse position - look for common position words
  const positionPatterns = [
    /(?:on\s+)?(?:the\s+)?(left|right|front|back|center|corner|side)\s*(wall|side|corner)?/i,
    /(?:at\s+)?(?:the\s+)?(entrance|exit|far end|near|ceiling|floor)/i,
    /(?:in\s+)?(?:the\s+)?(foreground|background|midground)/i
  ];

  let position = 'center';
  let description = restOfText;

  for (const pattern of positionPatterns) {
    const match = restOfText.match(pattern);
    if (match) {
      position = match[0].replace(/^(on|at|in)\s+(the\s+)?/i, '').trim();
      description = restOfText.replace(match[0], '').trim();
      break;
    }
  }

  // Build description from remaining text
  if (!description || description.length < 3) {
    description = `${foundType} at ${position}`;
  } else {
    // Clean up description
    description = description
      .replace(/^(with|leading to|showing|featuring)\s+/i, '')
      .trim();
    if (description.length > 0) {
      description = `${foundType} ${description}`;
    } else {
      description = `${foundType} at ${position}`;
    }
  }

  return {
    type: foundType,
    position,
    description
  };
}

/**
 * Parse furnishing items from a comma-separated string
 */
function parseFurnishing(furnishText: string): string[] {
  return furnishText
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Check if a command has any enhancement sections
 */
export function hasEnhancements(commandText: string): boolean {
  return /(?:navigable elements?|furnish|facade):/i.test(commandText);
}

/**
 * Format enhancements back into a string that can be appended to a command
 */
export function formatEnhancements(enhancements: Partial<ParsedEnhancements>): string {
  const parts: string[] = [];

  if (enhancements.navigableElements && enhancements.navigableElements.length > 0) {
    const navText = enhancements.navigableElements
      .map(e => `${e.type} ${e.position}${e.description ? ` ${e.description}` : ''}`)
      .join(', ');
    parts.push(`navigable elements: ${navText}`);
  }

  if (enhancements.furnishing && enhancements.furnishing.length > 0) {
    parts.push(`furnish: ${enhancements.furnishing.join(', ')}`);
  }

  if (enhancements.facade) {
    parts.push(`facade: ${enhancements.facade}`);
  }

  return parts.join(', ');
}
