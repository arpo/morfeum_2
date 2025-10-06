/**
 * Centralized prompt management
 */

import type { PromptKey, Language, PromptTemplates } from './types';
import { en } from './languages/en';

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

export type { PromptKey, Language } from './types';
