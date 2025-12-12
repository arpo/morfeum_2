/**
 * Character Creation Handler
 * Handles CREATE_CHARACTER_REAL and CREATE_CHARACTER_UNREAL intents
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../types';
import { buildEnvironmentDNA } from '../../generation/prompts/characters/buildEnvironmentDNA';
import type { CharacterType } from '../../generation/prompts/characters/characterPromptEngineering';

/**
 * Handle character creation intent
 * Builds environment DNA from current node and returns decision to create character
 */
export function handleCreateCharacter(
  intent: IntentResult,
  context: NavigationContext,
  characterType: CharacterType
): NavigationDecision {
  const { currentNode, parentNode } = context;
  
  // Must be at a location or niche to create a character
  if (currentNode.type !== 'location' && currentNode.type !== 'niche') {
    return {
      action: 'unknown',
      reasoning: `Cannot create character from ${currentNode.type}. Must be at a location or niche.`
    };
  }
  
  // Build environment DNA from current node
  // Merge with parent DNA if available for richer context
  const mergedDNA = parentNode?.dna ? { ...parentNode.dna, ...currentNode.dna } : currentNode.dna;
  
  const environmentDNA = buildEnvironmentDNA(
    {
      name: currentNode.name,
      description: currentNode.data.description,
      spaceType: currentNode.data.description?.toLowerCase().includes('interior') ? 'interior' : 'exterior',
      dna: currentNode.dna,
      dominantElements: currentNode.data.dominantElements,
      uniqueIdentifiers: currentNode.data.uniqueIdentifiers,
    },
    mergedDNA
  );
  
  return {
    action: 'create_character',
    parentNodeId: currentNode.id,
    metadata: {
      characterType,
      environmentDNA,
      userPrompt: intent.target || '',
      locationName: currentNode.name,
      locationId: currentNode.id,
    },
    reasoning: `Creating ${characterType} character at ${currentNode.name} with environment context`
  };
}

/**
 * Handle CREATE_CHARACTER_REAL intent
 */
export function handleCreateCharacterReal(
  intent: IntentResult,
  context: NavigationContext
): NavigationDecision {
  return handleCreateCharacter(intent, context, 'real');
}

/**
 * Handle CREATE_CHARACTER_UNREAL intent
 */
export function handleCreateCharacterUnreal(
  intent: IntentResult,
  context: NavigationContext
): NavigationDecision {
  return handleCreateCharacter(intent, context, 'unreal');
}
