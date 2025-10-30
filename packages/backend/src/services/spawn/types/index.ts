/**
 * Spawn Types - Main export aggregator
 * 
 * This file provides backward compatibility by re-exporting all types
 * from the new modular structure. Existing imports will continue to work.
 */

// Common types (shared across all entities)
export * from './common';

// Character types
export * from './character';

// Location types
export * from './location';

// Deprecated types (for backward compatibility during migration)
export * from './deprecated';
