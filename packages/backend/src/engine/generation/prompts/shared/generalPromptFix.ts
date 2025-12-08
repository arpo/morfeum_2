/**
 * @deprecated Use `applyMorfeumStyle` from `../../shared/applyMorfeumStyle` instead.
 * 
 * This function is kept for backward compatibility but will be removed in a future version.
 * 
 * Migration:
 * - For locations: applyMorfeumStyle(prompt) // excludeCreatures defaults to true
 * - For characters: applyMorfeumStyle(prompt, { excludeCreatures: false })
 */

import { applyMorfeumStyle } from "../../shared/applyMorfeumStyle";

/**
 * @deprecated Use `applyMorfeumStyle` instead
 */
export function generalPromptFix(prompt: string): string {
    console.warn('[DEPRECATED] generalPromptFix is deprecated. Use applyMorfeumStyle instead.');
    return applyMorfeumStyle(prompt);
}
