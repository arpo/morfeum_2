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
 * Generate DNA for a single node (now includes structural fields)
 * Returns both DNA and structural fields (navigableElements, dominantElements, etc.)
 */
export async function generateNodeDNA(
  apiKey: string,
  originalPrompt: string,
  nodeName: string,
  nodeType: LayerType,
  nodeDescription: string,
  parentContext?: ParentContext
): Promise<{
  dna: NodeDNA;
  name: string;
  description: string;
  navigableElements?: any[];
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
}> {
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

  // Parse JSON response (now includes both DNA and structural fields)
  const parsed = parseJSON<{
    name: string;
    description: string;
    navigableElements?: any[];
    dominantElements?: string[];
    uniqueIdentifiers?: string[];
    searchDesc?: string;
    slug?: string;
    dna: NodeDNA;
  }>(result.data.text);

  if (!parsed || !parsed.dna) {
    throw new Error('Failed to parse DNA from LLM response');
  }

  return parsed;
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
