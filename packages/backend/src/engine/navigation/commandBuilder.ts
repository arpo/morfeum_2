/**
 * Command Builder
 * Builds IntentResult from slash commands without LLM classification
 */

import type { IntentResult, NavigationIntent, NodeType } from './types';
import type { NavigationCommand } from '../../config/navigation';

/**
 * Build IntentResult from a slash command
 * Replaces LLM-based intent classification for direct command input
 * 
 * @param command - The navigation command (e.g., 'GO_INSIDE')
 * @param textAfterCommand - Optional text after the command (e.g., 'the red door')
 * @param currentNodeType - Type of the current node (for deriving spaceType)
 */
export function buildIntentFromCommand(
  command: NavigationCommand,
  textAfterCommand: string | null,
  currentNodeType: NodeType
): IntentResult {
  // Derive spaceType based on command and current node type
  const spaceType = deriveSpaceType(command, currentNodeType);
  
  return {
    intent: command as NavigationIntent,
    target: textAfterCommand?.trim() || null,
    spaceType
  };
}

/**
 * Derive spaceType based on command and current node type
 */
function deriveSpaceType(
  command: NavigationCommand,
  currentNodeType: NodeType
): 'interior' | 'exterior' | 'unknown' | null {
  switch (command) {
    case 'GO_INSIDE':
      return 'interior';
    // Add new command cases here as they are implemented
    default:
      // Derive from current node type
      if (currentNodeType === 'location') {
        return 'exterior';
      } else if (currentNodeType === 'niche') {
        return 'interior';
      }
      return 'unknown';
  }
}
