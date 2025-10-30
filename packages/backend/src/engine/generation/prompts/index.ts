/**
 * Prompt Generation Module
 * Centralized exports for all prompt generation functions and access API
 * 
 * Organized by domain:
 * - characters/ - Character generation prompts
 * - locations/ - Location and hierarchy prompts
 * - navigation/ - Navigation decision prompts
 * - chat/ - Chat interaction prompts
 * - shared/ - Shared constants and utilities
 * - samples/ - Sample prompts
 */

import type { PromptKey, Language, PromptTemplates } from './types';
import { en } from './languages/en';

// Domain exports
export * from './characters';
export * from './locations';
export * from './navigation';
export * from './samples';
export * from './chat';
export * from './shared';

// Type exports
export type { PromptKey, Language } from './types';

// Language map for prompt access
const languageMap: Record<Language, PromptTemplates> = {
  en
};

/**
 * Get a prompt by key and language
 * @param key - The prompt identifier
 * @param language - The language code (defaults to 'en')
 * @returns The prompt template or string
 */
export function getPrompt<K extends PromptKey>(
  key: K,
  language: Language = 'en'
): PromptTemplates[K] {
  const prompts = languageMap[language];
  
  if (!prompts) {
    throw new Error(`Language '${language}' not found`);
  }
  
  const prompt = prompts[key];
  
  if (!prompt) {
    throw new Error(`Prompt key '${key}' not found for language '${language}'`);
  }
  
  return prompt;
}
