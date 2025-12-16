/**
 * Command Builder
 * Builds IntentResult from slash commands without LLM classification
 * 
 * Now supports perspective flags (--interior, --exterior, --open-air)
 */

import type { IntentResult, NavigationIntent, NodeType, ScenePerspective } from './types';
import type { NavigationCommand } from '../../config/navigation';

/**
 * Build IntentResult from a slash command
 * Replaces LLM-based intent classification for direct command input
 * 
 * @param command - The navigation command (e.g., 'GO_INSIDE')
 * @param textAfterCommand - Optional text after the command (e.g., 'the red door')
 * @param currentNodeType - Type of the current node (for deriving spaceType)
 * @param perspectiveOverride - Optional perspective flag from user (--interior, --exterior, --open-air)
 */
export function buildIntentFromCommand(
  command: NavigationCommand,
  textAfterCommand: string | null,
  currentNodeType: NodeType,
  perspectiveOverride?: ScenePerspective | null
): IntentResult {
  // If user specified a perspective flag, use it; otherwise let LLM determine
  const spaceType = perspectiveOverride ?? deriveSpaceType(command, currentNodeType);
  
  return {
    intent: command as NavigationIntent,
    target: textAfterCommand?.trim() || null,
    spaceType
  };
}

/**
 * Derive spaceType based on command and current node type
 * Note: Both GO_INSIDE and GOTO now return null to let LLM determine perspective
 */
function deriveSpaceType(
  command: NavigationCommand,
  currentNodeType: NodeType
): ScenePerspective | 'unknown' | null {
  switch (command) {
    case 'GO_INSIDE':
      // GO_INSIDE perspective is now determined by LLM analysis
      // based on parent location's spaceType and user's target
      return null;
    case 'GOTO':
      // GOTO perspective is determined by LLM analysis of the destination
      return null;
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
