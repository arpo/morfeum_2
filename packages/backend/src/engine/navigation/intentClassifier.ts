/**
 * Intent Classifier Service
 * Uses LLM to classify user navigation commands
 */

import * as mzooService from '../../services/mzoo.service';
import { AI_MODELS } from '../../config';
import { intentClassifierPrompt } from '../generation/prompts/navigation';
import type { IntentResult, NodeType } from './types';

/**
 * Classify user's navigation intent using LLM
 * @param apiKey - MZOO API key
 * @param userCommand - Natural language command from user
 * @param currentNodeType - Type of node user is currently at
 * @param currentNodeName - Name of current node
 * @param navigableElements - Optional navigable spaces/rooms
 * @param dominantElements - Optional dominant visual elements
 * @returns IntentResult with classified intent and extracted information
 */
export async function classifyIntent(
  apiKey: string,
  userCommand: string,
  currentNodeType: NodeType,
  currentNodeName: string,
  navigableElements?: Array<{ type: string; position: string; description: string }>,
  dominantElements?: string[]
): Promise<IntentResult> {
  
  // Generate prompt
  const prompt = intentClassifierPrompt({
    userCommand,
    currentNode: {
      type: currentNodeType,
      name: currentNodeName,
      navigableElements,
      dominantElements
    }
  });
  
  // Call LLM for intent classification
  const response = await mzooService.generateText(
    apiKey,
    [{ role: 'user', content: prompt }],
    AI_MODELS.NAVIGATOR
  );
  
  // Handle errors
  if (response.error || !response.data) {
    return {
      intent: 'UNKNOWN',
      target: null,
      direction: null,
      confidence: 0
    };
  }
  
  // Extract text from response
  const text = typeof response.data === 'string' 
    ? response.data 
    : (response.data.text || JSON.stringify(response.data));
  
  // Clean up response (remove markdown code fences if present)
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
  }
  
  // Parse JSON
  try {
    const result: IntentResult = JSON.parse(cleaned);
    return result;
  } catch (parseError) {
    // If parsing fails, return unknown intent
    return {
      intent: 'UNKNOWN',
      target: null,
      direction: null,
      confidence: 0
    };
  }
}
