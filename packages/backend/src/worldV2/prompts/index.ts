/**
 * World V2 Prompts Index
 * 
 * TODO: Remove when V2 is stable and old system is removed
 */

// Individual node prompts (used by standalone commands)
export { buildHostDNAPrompt, parseHostResponse } from './hostDNA';
export { buildRegionDNAPrompt, parseRegionResponse } from './regionDNA';
export { buildLocationDNAPrompt, parseLocationResponse } from './locationDNA';

// Legacy categorization (replaced by worldLocationFull for better performance)
export { 
  buildWorldLocationCategorizationPrompt, 
  parseWorldLocationCategorizationResponse,
  type WorldLocationCategorization,
  type VisualElements
} from './worldLocationCategorization';

// Combined prompt (single LLM call for /NEW_WORLD_LOCATION)
export {
  buildWorldLocationFullPrompt,
  parseWorldLocationFullResponse,
  type WorldLocationFullResult
} from './worldLocationFull';

// Shared prompt sections
export * from './shared/dnaSchema';
