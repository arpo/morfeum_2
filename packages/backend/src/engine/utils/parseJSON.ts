/**
 * JSON Parser Utility
 * Handles parsing JSON responses from AI models that may include markdown fences
 */

/**
 * Parse JSON from AI response, handling markdown code fences
 * @param text - Raw text response from AI (may contain markdown)
 * @returns Parsed JSON object
 * @throws Error if JSON is invalid
 */
export function parseJSON<T = any>(text: string): T {
  // Trim whitespace
  let cleaned = text.trim();
  
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    // Remove opening fence (```json or ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*\n/, '');
    // Remove closing fence
    cleaned = cleaned.replace(/\n```\s*$/, '');
  }
  
  // Trim again after fence removal
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[parseJSON] Failed to parse:', cleaned.substring(0, 200));
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safe JSON parse that returns null on failure
 * @param text - Raw text to parse
 * @returns Parsed object or null
 */
export function safeParseJSON<T = any>(text: string): T | null {
  try {
    return parseJSON<T>(text);
  } catch {
    return null;
  }
}
