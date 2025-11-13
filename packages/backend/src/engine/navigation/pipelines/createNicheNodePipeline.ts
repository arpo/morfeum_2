/**
 * Create Niche Node Pipeline
 * Generates image for stepping inside a location (GO_INSIDE intent)
 */

import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { nicheImagePrompt } from '../../generation/prompts/navigation/nicheImagePrompt';
import { generateNodeDNA, extractParentContext } from '../../hierarchyAnalysis/nodeDNAGenerator';
import { generateLocationImage } from '../../generation/shared/imageGeneration';
import { buildNode } from '../../generation/shared/nodeBuilder';
import type { NavigationDecision, NavigationContext, IntentResult } from '../types';

/**
 * Generate image prompt for stepping inside using LLM
 */
async function generateNicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  apiKey: string
): Promise<string> {
  const prompt = nicheImagePrompt(context, intent, decision);

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate image prompt for stepping inside: ${context.currentNode.name}` }
  ];

  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No image prompt returned from LLM');
  }
  return result.data.text.trim();
}


/**
 * Run the complete niche image generation pipeline
 */
export async function runCreateNichePipeline(
  decision: NavigationDecision,
  context: NavigationContext,
  intent: IntentResult,
  apiKey: string
): Promise<{ imageUrl: string; imagePrompt: string; node: any }> {
  // Step 1: Generate image prompt using LLM with full context
  const imagePrompt = await generateNicheImagePrompt(
    context,
    intent,
    decision,
    apiKey
  );

  // Step 2: Generate FLUX image using shared module
  const { imageUrl, imagePrompt: fixedPrompt } = await generateLocationImage(
    apiKey,
    imagePrompt
  );

  // Step 3: Generate DNA for the node
  console.log('\n🧬 [PIPELINE] Generating DNA for niche node...');
  
  const nodeName = decision.newNodeName || 'Unnamed Niche';
  
  // Extract parent context from current node
  const parentContext = context.currentNode.dna 
    ? extractParentContext(context.currentNode.dna)
    : undefined;
  
  // Use centralized DNA generator
  const dna = await generateNodeDNA(
    apiKey,
    imagePrompt,
    nodeName,
    'niche',
    imagePrompt,
    parentContext
  );
  
  console.log('✅ [PIPELINE] DNA generated successfully. Fields:', Object.keys(dna).join(', '));

  // Step 4: Build complete node using shared builder
  const node = buildNode('niche', nodeName, dna, imageUrl);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ NODE CREATED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ID:', node.id);
  console.log('  Type:', node.type);
  console.log('  Name:', node.name);
  console.log('  Has DNA:', !!node.dna ? '✓' : '✗');
  console.log('  Has Image:', !!node.imagePath ? '✓' : '✗');
  console.log('═══════════════════════════════════════════════════════════\n');

  return {
    imageUrl,
    imagePrompt,
    node
  };
}
