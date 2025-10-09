/**
 * Movement Classification Prompt
 * Classifies user movement intent within the world
 */

export const movementClassification = (
  userCommand: string,
  currentLocationName: string,
  knownLocationNames: string
): string => {
  return `You are a movement classifier for Morfeum.
Decide how the user is trying to move in the world.

User command: "${userCommand}"
Current location: ${currentLocationName}
Known locations in the current world:
${knownLocationNames}

Respond with ONE WORD ONLY:
- "descend" → going into or below the current place (interior, underground, beneath)
- "ascend" → going out of or above the current place (exit, climb up, leave)
- "traverse" → moving to an adjacent or nearby place (same level, visible from here)
- "jump" → traveling far away within the same world (distant location, teleport)

No punctuation, no explanation — just the word.`;
};
