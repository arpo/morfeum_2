/**
 * Prompt Enhancer Service
 * 
 * Calls LLM to suggest navigable elements, furnishing, and facade details
 * based on the current node context and the user's destination text.
 */

import * as mzooService from '../mzoo.service';
import { AI_MODELS } from '../../config';
import { buildEnhancerPrompt } from '../../engine/generation/prompts/enhancer/enhancerPromptTemplate';

export interface EnhancePromptInput {
  /** The command type (GO_INSIDE, GOTO, NEW_LOCATION) */
  commandType: 'GO_INSIDE' | 'GOTO' | 'NEW_LOCATION';
  /** The destination text from the user's command */
  destinationText: string;
  /** Current node context */
  currentNode: {
    id: string;
    name: string;
    type: string;
    description?: string;
    dna?: any;
    navigableElements?: Array<{ type: string; position: string; description: string }>;
    dominantElements?: string[];
  };
}

export interface EnhancePromptResult {
  /** The enhancement string to append to the command */
  enhancement: string;
  /** Whether the enhancement was successfully generated */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Generate enhancement suggestions for a command using LLM
 * 
 * @param apiKey - MZOO API key
 * @param input - Enhancement input parameters
 * @returns Enhancement string to append to command
 */
export async function enhancePrompt(
  apiKey: string,
  input: EnhancePromptInput
): Promise<EnhancePromptResult> {
  try {
    // Build the prompt using the template
    const prompt = buildEnhancerPrompt(
      input.commandType,
      {
        name: input.currentNode.name,
        type: input.currentNode.type,
        description: input.currentNode.description,
        dna: input.currentNode.dna,
        navigableElements: input.currentNode.navigableElements,
        dominantElements: input.currentNode.dominantElements
      },
      input.destinationText
    );

    // Call LLM for enhancement suggestions
    const response = await mzooService.generateText(
      apiKey,
      [{ role: 'user', content: prompt }],
      AI_MODELS.NAVIGATOR
    );

    // Handle errors
    if (response.error || !response.data) {
      console.error('[PromptEnhancer] LLM call failed:', response.error);
      return {
        enhancement: '',
        success: false,
        error: response.error || 'Failed to generate enhancement'
      };
    }

    // Extract text from response
    const text = typeof response.data === 'string' 
      ? response.data 
      : (response.data.text || '');

    // Clean up response - remove any markdown formatting
    let enhancement = text.trim();
    if (enhancement.startsWith('```')) {
      enhancement = enhancement.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    }
    
    // Remove any quotes if the LLM wrapped the response
    enhancement = enhancement.replace(/^["']|["']$/g, '').trim();

    console.log('[PromptEnhancer] Generated enhancement:', enhancement);

    return {
      enhancement,
      success: true
    };
  } catch (error) {
    console.error('[PromptEnhancer] Error:', error);
    return {
      enhancement: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
