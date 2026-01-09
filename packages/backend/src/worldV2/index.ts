/**
 * World V2 Module
 * 
 * Simplified world creation system.
 * TODO: When V2 is stable, rename from worldV2 to world
 */

// Export router
export { worldV2Router } from './routes';

// Export types
export * from './types';

// Export prompts
export { buildHostDNAPrompt, parseHostResponse } from './prompts/hostDNA';
