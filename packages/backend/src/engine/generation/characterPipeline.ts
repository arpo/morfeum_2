/**
 * Character Generation Pipeline
 * New engine implementation using migrated prompts
 */

import { parseJSON } from '../utils/parseJSON';
import * as mzooService from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import type { EntitySeed, VisualAnalysis, DeepProfile } from '../types';

// Import new prompt templates
import { characterSeedPrompt } from './prompts/characterSeed';
import { characterImagePrompt } from './prompts/characterImage';
import { characterVisualAnalysisPrompt } from './prompts/characterVisualAnalysis';
import { characterDeepProfilePrompt } from './prompts/characterDeepProfile';

/**
 * Fetch image as base64
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * Generate character seed
 */
export async function generateCharacterSeed(
  userPrompt: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<EntitySeed> {
  console.log('[CharacterPipeline] Generating seed...');
  
  const prompt = characterSeedPrompt(userPrompt);
  console.log(`[CharacterPipeline] Seed prompt: ~${Math.ceil(prompt.length / 4)} tokens`);
  
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: userPrompt }
  ];

  const result = await mzooService.generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No seed data returned');
  }

  const seed = parseJSON<EntitySeed>(result.data.text);
  seed.originalPrompt = userPrompt;
  
  console.log('[CharacterPipeline] Seed generated:', seed.name);
  return seed;
}

/**
 * Generate character image
 */
export async function generateCharacterImage(
  seed: EntitySeed,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ imageUrl: string; imagePrompt: string }> {
  console.log('[CharacterPipeline] Generating image...');
  
  const imagePromptText = characterImagePrompt(
    seed.originalPrompt || '',
    seed.name,
    seed.looks,
    seed.wearing || '',
    seed.personality || '',
    seed.presence,
    seed.setting,
    'Half Portrait'
  );
  
  console.log(`[CharacterPipeline] Image prompt: ~${Math.ceil(imagePromptText.length / 4)} tokens`);

  const result = await mzooService.generateImage(
    apiKey,
    imagePromptText,
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

  console.log('[CharacterPipeline] Image generated:', imageUrl);
  return { imageUrl, imagePrompt: imagePromptText };
}

/**
 * Analyze character image
 */
export async function analyzeCharacterImage(
  imageUrl: string,
  seed: EntitySeed,
  apiKey: string,
  signal?: AbortSignal
): Promise<VisualAnalysis> {
  console.log('[CharacterPipeline] Analyzing image...');
  
  const base64Image = await fetchImageAsBase64(imageUrl);
  
  const analysisPrompt = characterVisualAnalysisPrompt(
    seed.name,
    seed.looks,
    seed.wearing || '',
    seed.personality || '',
    seed.presence
  );
  
  console.log(`[CharacterPipeline] Visual analysis prompt: ~${Math.ceil(analysisPrompt.length / 4)} tokens`);

  const result = await mzooService.analyzeImage(
    apiKey,
    base64Image,
    analysisPrompt,
    'image/jpeg',
    AI_MODELS.VISUAL_ANALYSIS
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No visual analysis data returned');
  }

  const analysis = parseJSON<VisualAnalysis>(result.data.text);
  console.log('[CharacterPipeline] Visual analysis complete');
  return analysis;
}

/**
 * Enrich character profile
 */
export async function enrichCharacterProfile(
  seed: EntitySeed,
  visualAnalysis: VisualAnalysis,
  apiKey: string,
  signal?: AbortSignal
): Promise<DeepProfile> {
  console.log('[CharacterPipeline] Enriching profile...');
  
  const seedJson = JSON.stringify(seed, null, 2);
  const visionJson = JSON.stringify(visualAnalysis, null, 2);
  const originalPrompt = seed.originalPrompt || 'No specific request provided';

  const enrichmentPrompt = characterDeepProfilePrompt(
    seedJson,
    visionJson,
    originalPrompt
  );
  
  console.log(`[CharacterPipeline] Deep profile prompt: ~${Math.ceil(enrichmentPrompt.length / 4)} tokens`);

  const messages = [
    { role: 'system', content: enrichmentPrompt },
    { role: 'user', content: 'Generate the complete character profile based on the provided data.' }
  ];

  const result = await mzooService.generateText(
    apiKey,
    messages,
    AI_MODELS.PROFILE_ENRICHMENT
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No profile data returned');
  }

  const profile = parseJSON<DeepProfile>(result.data.text);
  console.log('[CharacterPipeline] Profile enriched');
  return profile;
}

/**
 * Run complete character generation pipeline
 */
export async function runCharacterPipeline(
  userPrompt: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<{
  seed: EntitySeed;
  imageUrl: string;
  imagePrompt: string;
  visualAnalysis: VisualAnalysis;
  deepProfile: DeepProfile;
}> {
  console.log('[CharacterPipeline] Starting complete pipeline...');
  const startTime = Date.now();

  // Step 1: Generate seed
  const seed = await generateCharacterSeed(userPrompt, apiKey, signal);
  
  // Step 2: Generate image
  const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey, signal);
  
  // Step 3: Analyze image
  const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey, signal);
  
  // Step 4: Enrich profile
  const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey, signal);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[CharacterPipeline] Pipeline complete in ${elapsed}s`);

  return {
    seed,
    imageUrl,
    imagePrompt,
    visualAnalysis,
    deepProfile
  };
}
