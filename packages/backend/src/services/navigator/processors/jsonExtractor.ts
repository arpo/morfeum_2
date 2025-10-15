/**
 * JSON Extraction Processor
 * Extracts and cleans JSON from AI responses
 */

/**
 * Extract JSON from AI response text that may include markdown formatting or explanatory text
 * Handles various formats:
 * - Plain JSON objects
 * - JSON in markdown code blocks (```json)
 * - JSON with preceding explanatory text
 * - JSON in generic code blocks (```)
 */
export function extractJSON(text: string): string {
  // Handle case where text is already an object with 'text' property (MZOO format)
  let jsonText: string;
  if (typeof text === 'string') {
    jsonText = text;
  } else if (text && typeof text === 'object' && 'text' in text) {
    jsonText = (text as any).text;
  } else {
    jsonText = JSON.stringify(text);
  }
  
  jsonText = jsonText.trim();
  
  // Try to extract from ```json blocks first (most specific)
  const jsonFenceMatch = jsonText.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonFenceMatch) {
    return jsonFenceMatch[1].trim();
  }
  
  // Try to extract from generic code blocks with ```json prefix
  if (jsonText.includes('```json')) {
    const startIndex = jsonText.indexOf('```json') + 7;
    const endIndex = jsonText.lastIndexOf('```');
    return jsonText.substring(startIndex, endIndex).trim();
  }
  
  // Try to extract from generic code blocks
  if (jsonText.startsWith('```')) {
    return jsonText.substring(3, jsonText.lastIndexOf('```')).trim();
  }
  
  // Last resort: extract first complete JSON object
  if (jsonText.includes('{')) {
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return jsonText.substring(firstBrace, lastBrace + 1).trim();
    }
  }
  
  return jsonText;
}

/**
 * Parse JSON from AI response, handling various formatting scenarios
 */
export function parseAIResponse<T>(response: any): T {
  const jsonText = extractJSON(response);
  return JSON.parse(jsonText);
}
