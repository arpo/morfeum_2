/**
 * Create Niche Node Pipeline
 * Generates image for stepping inside a location (GO_INSIDE intent)
 */

import { generateText, generateImage } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { nicheImagePrompt } from '../../generation/prompts/navigation/nicheImagePrompt';
import { nodeDNAGeneration } from '../../generation/prompts/locations/nodeDNAGeneration';
import type { NavigationDecision, NavigationContext, IntentResult } from '../types';
import { generalPromptFix } from '../../generation/prompts/shared/generalPromptFix';

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
 * Generate DNA for the niche node using LLM
 */
async function generateNicheDNA(
  imagePrompt: string,
  context: NavigationContext,
  decision: NavigationDecision,
  apiKey: string
): Promise<any> {
  // Extract parent DNA context (same as nicheImagePrompt.ts)
  const parentContext = {
    architectural_tone: context.currentNode.dna?.architectural_tone,
    cultural_tone: context.currentNode.dna?.cultural_tone,
    dominant: context.currentNode.data.colors_dominant,
    mood: context.currentNode.dna?.mood_baseline
  };

  const nodeName = decision.newNodeName || 'Unnamed Niche';

  const prompt = nodeDNAGeneration(
    imagePrompt,
    nodeName,
    'niche',
    imagePrompt,
    parentContext
  );

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📝 DNA GENERATION PROMPT (Sent to LLM)');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(prompt);
  console.log('\n═══════════════════════════════════════════════════════════\n');

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate DNA for: ${nodeName}` }
  ];

  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA returned from LLM');
  }

  // Parse JSON from response
  const jsonMatch = result.data.text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in DNA generation response');
  }

  return JSON.parse(jsonMatch[0]);
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

  const fixedPrompt = generalPromptFix(imagePrompt);

  // Step 2: Generate FLUX image
  const result = await generateImage(
    apiKey,
    fixedPrompt,
    1,
    'landscape_16_9',
    'none'
  );

  if (result.error) {
    throw new Error(result.error);
  }

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Image URL not found in response');
  }

  // Step 3: Generate DNA for the node
  console.log('\n🧬 [PIPELINE] Generating DNA for niche node...');
  const dna = await generateNicheDNA(imagePrompt, context, decision, apiKey);
  console.log('✅ [PIPELINE] DNA generated successfully. Fields:', Object.keys(dna).join(', '));

  // Step 4: Build complete node
  const nodeId = `niche-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const nodeName = decision.newNodeName || 'Unnamed Niche';

  const node = {
    id: nodeId,
    type: 'niche',
    name: nodeName,
    dna,
    imagePath: imageUrl,
    focus: {
      node_id: nodeId,
      perspective: 'interior',
      viewpoint: 'default view',
      distance: 'close'
    }
  };

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
