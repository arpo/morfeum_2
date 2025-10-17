/**
 * Tagged Template System
 * Type-safe prompt templates with variable interpolation
 */

/**
 * Build a prompt from a template function
 * Template functions use tagged template literals for type safety
 * 
 * Example:
 * ```
 * const template = (name: string, age: number) => `
 *   Generate a character named ${name} who is ${age} years old.
 * `;
 * 
 * const prompt = buildPrompt(template, "Alice", 25);
 * ```
 */
export function buildPrompt<T extends (...args: any[]) => string>(
  templateFn: T,
  ...args: Parameters<T>
): string {
  const result = templateFn(...args);
  
  // Trim leading/trailing whitespace
  return result.trim();
}

/**
 * Count approximate tokens in a string
 * Simple estimation: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Log prompt details for debugging
 */
export function logPrompt(name: string, prompt: string): void {
  const tokens = estimateTokens(prompt);
  console.log(`[Prompt] ${name} - ~${tokens} tokens`);
}
