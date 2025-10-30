/**
 * Prompt Generation Module
 * Centralized exports for all prompt generation functions
 * 
 * Organized by domain:
 * - characters/ - Character generation prompts
 * - locations/ - Location and hierarchy prompts
 * - navigation/ - Navigation decision prompts
 * - samples/ - Sample prompts (for future migration)
 */

// Character prompts
export * from './characters';

// Location and hierarchy prompts
export * from './locations';

// Navigation prompts
export * from './navigation';

// Sample prompts (empty for now, will be populated during migration)
export * from './samples';
