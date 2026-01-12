/**
 * Region DNA Generation Prompt
 * 
 * V2 World System - Delta-only DNA inheritance from host
 */

import { Host } from '../types';

/**
 * Build the prompt for generating a Region node with delta-only DNA
 * @param concept - User's region concept description
 * @param hostJSON - The parent host's complete JSON
 */
export function buildRegionDNAPrompt(concept: string, host: Host): string {
  // Only include essential host context, not full JSON dump
  const hostContext = {
    name: host.name,
    genre: host.genre,
    weather: host.weather,
    timeOfDay: host.timeOfDay,
    dna: host.dna
  };
  
  // Build environment context
  const envParts: string[] = [];
  if (host.weather) envParts.push(`Weather: ${host.weather}`);
  if (host.timeOfDay) envParts.push(`Time: ${host.timeOfDay.replace('_', ' ')}`);
  const envLine = envParts.length > 0 ? `\nEnvironment: ${envParts.join(', ')}` : '';
  
  return `Output ONE valid JSON object. No markdown.

REGION in host "${host.name}" (${host.genre}).${envLine}
Delta-only: Only add DNA that differs from host. Empty arrays if no difference.

{
  "id": "__AUTO__",
  "type": "region",
  "name": "...",
  "slug": "...",
  "description": "...",
  "dna": { "essence": [], "formsAndMaterials": [], "colorAndLight": [], "atmosphere": [], "banned": [] }
}

RULES: Exact keys. slug=kebab-case. Preserve proper nouns.

HOST DNA: ${JSON.stringify(hostContext.dna)}

CONCEPT: ${concept}`;
}

/**
 * Parse the LLM response into a Region object
 * Handles the __AUTO__ id replacement
 */
export function parseRegionResponse(jsonString: string, generateId: () => string): {
  id: string;
  type: 'region';
  name: string;
  slug: string;
  description: string;
  dna: {
    essence: string[];
    formsAndMaterials: string[];
    colorAndLight: string[];
    atmosphere: string[];
    banned: string[];
  };
} {
  // Clean the response - remove markdown code blocks if present
  let cleaned = jsonString.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  const parsed = JSON.parse(cleaned);
  
  // Validate required fields
  if (parsed.type !== 'region') {
    throw new Error(`Expected type "region", got "${parsed.type}"`);
  }
  
  if (!parsed.name || !parsed.slug || !parsed.description || !parsed.dna) {
    throw new Error('Missing required fields in region response');
  }
  
  // Validate DNA structure (can be empty arrays for delta-only)
  const dna = parsed.dna;
  const requiredArrays = ['essence', 'formsAndMaterials', 'colorAndLight', 'atmosphere', 'banned'];
  for (const field of requiredArrays) {
    if (!Array.isArray(dna[field])) {
      throw new Error(`dna.${field} must be an array`);
    }
  }
  
  // Replace __AUTO__ with generated ID
  return {
    ...parsed,
    id: generateId()
  };
}
