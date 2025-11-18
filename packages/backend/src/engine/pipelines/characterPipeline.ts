/**
 * Character Generation Pipeline
 * New engine implementation using migrated prompts
 */

import { parseJSON } from '../utils/parseJSON';
import { AI_MODELS } from '../../config/constants';
import type { EntitySeed, VisualAnalysis, DeepProfile } from '../types';
import { getPrompt } from '../generation/prompts';

// Import new prompt templates
import { characterSeedPrompt } from '../generation/prompts/characters/characterSeed';
import { characterImagePrompt } from '../generation/prompts/characters/characterImage';
import { characterVisualAnalysisPrompt } from '../generation/prompts/characters/characterVisualAnalysis';
import { characterDeepProfilePrompt } from '../generation/prompts/characters/characterDeepProfile';

// Import shared utilities
import { generateImage } from './shared/imageGeneration';
import { analyzeImageWithPrompt } from './shared/visualAnalysis';
import { PipelineTimer } from './shared/pipelineLogger';
import * as mzooService from '../../services/mzoo';

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

  const { imageUrl } = await generateImage(apiKey, imagePromptText, 1, 'landscape_16_9', 'none');

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
  const analysisPrompt = characterVisualAnalysisPrompt(
    seed.name,
    seed.looks,
    seed.wearing || '',
    seed.personality || '',
    seed.presence
  );

  const analysis = await analyzeImageWithPrompt<VisualAnalysis>(
    apiKey,
    imageUrl,
    analysisPrompt,
    AI_MODELS.VISUAL_ANALYSIS
  );

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
  const timer = new PipelineTimer('CharacterPipeline');

  // Step 1: Generate seed
  timer.start('Seed Generation');
  const seed = await generateCharacterSeed(userPrompt, apiKey, signal);
  timer.end('Seed Generation');
  
  // Step 2: Generate image
  timer.start('Image Generation');
  const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey, signal);
  timer.end('Image Generation');
  
  // Step 3: Analyze image
  timer.start('Visual Analysis');
  const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey, signal);
  timer.end('Visual Analysis');
  
  // Step 4: Enrich profile
  timer.start('Profile Enrichment');
  const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey, signal);
  timer.end('Profile Enrichment');

  // Log completion with timing breakdown
  timer.logSummary('character');

  return {
    seed,
    imageUrl,
    imagePrompt,
    visualAnalysis,
    deepProfile
  };
}
