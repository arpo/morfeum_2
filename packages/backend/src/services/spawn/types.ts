/**
 * @deprecated This file has been refactored into modular type files.
 * 
 * New structure:
 * - types/common.ts - Shared types (VisualAnchors, SpawnProcess, etc.)
 * - types/character.ts - Character-specific types
 * - types/location.ts - Location-specific types
 * - types/deprecated.ts - Legacy types
 * 
 * This file re-exports everything for backward compatibility.
 * Import from './types/' subdirectory in new code.
 * This file will be removed in a future release.
 */

export * from './types/index';
