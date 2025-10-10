/**
 * Common utilities shared across all pipeline managers
 */

/**
 * Parse JSON from AI response text
 */
export function parseJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  return JSON.parse(jsonMatch[0]);
}

/**
 * Fetch image and convert to base64
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(imageBuffer).toString('base64');
}

/**
 * Check if abort signal has been triggered
 */
export function checkAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new Error('Operation aborted');
  }
}
