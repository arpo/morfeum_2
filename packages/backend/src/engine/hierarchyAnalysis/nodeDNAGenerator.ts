/**
 * Node DNA Generator
 * 
 * Generates simplified, flat DNA structure for each node in the hierarchy
 * Uses LLM to create visual and atmospheric profiles
 * 
 * Supports batched generation:
 * - Host + All Regions (1 call)
 * - Locations + Niches per region (1 call per region)
 */

import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { nodeDNAGeneration } from '../generation/prompts/locations/nodeDNAGeneration';
import type { NodeDNA, LayerType, ParentContext } from './types';

/**
 * Generate DNA for a single node
 */
export async function generateNodeDNA(
  apiKey: string,
  originalPrompt: string,
  nodeName: string,
  nodeType: LayerType,
  nodeDescription: string,
  parentContext?: ParentContext
): Promise<NodeDNA> {
  // Build prompt from centralized prompts
  const prompt = nodeDNAGeneration(
    originalPrompt,
    nodeName,
    nodeType,
    nodeDescription,
    parentContext
  );

  // Call LLM (using fast model for text generation)
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate DNA for: ${nodeName}` }
  ];

  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION // Fast model for text-only generation
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA data returned from LLM');
  }

  // Parse JSON response
  const parsedDNA = parseJSON<NodeDNA>(result.data.text);

  if (!parsedDNA) {
    throw new Error('Failed to parse DNA from LLM response');
  }

  return parsedDNA;
}

/**
 * Extract parent context from parent node DNA
 */
export function extractParentContext(parentDNA?: NodeDNA): ParentContext {
  if (!parentDNA) {
    return {};
  }

  return {
    architectural_tone: parentDNA.architectural_tone,
    cultural_tone: parentDNA.cultural_tone,
    dominant: parentDNA.dominant,
    mood: parentDNA.mood
  };
}
