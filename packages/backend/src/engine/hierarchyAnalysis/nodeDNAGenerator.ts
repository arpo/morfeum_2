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

  // DEBUG: Log what we're sending to the LLM
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║ DNA GENERATION - LLM INPUT                                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('Node:', nodeName, '| Type:', nodeType);
  console.log('Parent Context Present:', !!parentContext);
  if (parentContext) {
    console.log('Parent looks:', parentContext.looks?.substring(0, 100) + '...');
    console.log('Parent materials:', parentContext.materials?.substring(0, 100) + '...');
    console.log('Parent architectural_tone:', parentContext.architectural_tone);
  }
  console.log('\n--- FULL PROMPT (first 2000 chars) ---');
  console.log(prompt.substring(0, 2000));
  console.log('--- END PROMPT PREVIEW ---\n');

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

  // DEBUG: Log what we got back from the LLM
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║ DNA GENERATION - LLM OUTPUT                                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('Raw response (first 2000 chars):');
  console.log(result.data.text.substring(0, 2000));
  console.log('--- END LLM OUTPUT PREVIEW ---\n');

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
 * Now passes ALL parent DNA for full CSS-like inheritance
 */
export function extractParentContext(parentDNA?: NodeDNA): NodeDNA | undefined {
  return parentDNA; // Pass everything, let LLM see all context
}

/**
 * Merge child DNA with parent DNA (CSS-like inheritance)
 * Any null/undefined fields in child will be filled from parent
 */
export function mergeDNAWithParent(childDNA: NodeDNA, parentDNA?: NodeDNA): NodeDNA {
  if (!parentDNA) return childDNA;
  
  const merged = { ...childDNA };
  
  // Iterate through all parent keys and fill null/undefined values
  for (const key of Object.keys(parentDNA) as (keyof NodeDNA)[]) {
    if (merged[key] === null || merged[key] === undefined) {
      (merged as any)[key] = parentDNA[key];
    }
  }
  
  return merged;
}
