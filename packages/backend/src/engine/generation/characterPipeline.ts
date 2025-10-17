/**
 * Character Generation Pipeline
 * New engine implementation using migrated prompts
 */

import { parseJSON } from '../utils/parseJSON';
import * as mzooService from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import type { EntitySeed, VisualAnalysis, DeepProfile } from '../types';
import { getPrompt } from '../../prompts';

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
  const prompt = characterSeedPrompt(userPrompt);
  
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
  const base64Image = await fetchImageAsBase64(imageUrl);
  
  const analysisPrompt = characterVisualAnalysisPrompt(
    seed.name,
    seed.looks,
    seed.wearing || '',
    seed.personality || '',
    seed.presence
  );

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
  const seedJson = JSON.stringify(seed, null, 2);
  const visionJson = JSON.stringify(visualAnalysis, null, 2);
  const originalPrompt = seed.originalPrompt || 'No specific request provided';

  const enrichmentPrompt = characterDeepProfilePrompt(
    seedJson,
    visionJson,
    originalPrompt
  );

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
  return profile;
}

/**
 * Generate initial system prompt from seed (for chat personality)
 * Uses the same approach as old CharacterSpawnManager
 */
export function generateInitialSystemPrompt(seed: EntitySeed): string {
  const entityData = getPrompt('basicEntityDataFormatting', 'en')(
    seed.name,
    seed.looks,
    seed.wearing || '',
    seed.personality || ''
  );
  return getPrompt('chatCharacterImpersonation', 'en')(entityData);
}

/**
 * Generate enhanced system prompt from deep profile (for chat personality)
 * Uses the same approach as old CharacterSpawnManager
 */
export function generateEnhancedSystemPrompt(deepProfile: DeepProfile): string {
  const enhancedData = getPrompt('enhancedEntityDataFormatting', 'en')(deepProfile);
  return getPrompt('chatCharacterImpersonation', 'en')(enhancedData);
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
  const pipelineStartTime = Date.now();
  const timings = {
    seedGeneration: 0,
    imageGeneration: 0,
    visualAnalysis: 0,
    profileEnrichment: 0
  };

  // Step 1: Generate seed
  const seedStartTime = Date.now();
  const seed = await generateCharacterSeed(userPrompt, apiKey, signal);
  timings.seedGeneration = Date.now() - seedStartTime;
  
  // Step 2: Generate image
  const imageStartTime = Date.now();
  const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey, signal);
  timings.imageGeneration = Date.now() - imageStartTime;
  
  // Step 3: Analyze image
  const analysisStartTime = Date.now();
  const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey, signal);
  timings.visualAnalysis = Date.now() - analysisStartTime;
  
  // Step 4: Enrich profile
  const enrichStartTime = Date.now();
  const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey, signal);
  timings.profileEnrichment = Date.now() - enrichStartTime;

  // Log completion with timing breakdown
  const totalTime = Date.now() - pipelineStartTime;
  console.log(`\n[CharacterPipeline] Character generation completed in ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`  Entity Type: character`);
  console.log(`  Stage Timings:`);
  console.log(`    - Seed Generation:     ${(timings.seedGeneration / 1000).toFixed(2)}s`);
  console.log(`    - Image Generation:    ${(timings.imageGeneration / 1000).toFixed(2)}s`);
  console.log(`    - Visual Analysis:     ${(timings.visualAnalysis / 1000).toFixed(2)}s`);
  console.log(`    - Profile Enrichment:  ${(timings.profileEnrichment / 1000).toFixed(2)}s`);
  console.log(`  Total:                   ${(totalTime / 1000).toFixed(2)}s\n`);

  return {
    seed,
    imageUrl,
    imagePrompt,
    visualAnalysis,
    deepProfile
  };
}
