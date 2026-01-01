/**
 * Character Generation Pipeline
 * New engine implementation using migrated prompts
 * 
 * Uses Gemini Explicit Caching for 90% cost reduction on static prompt content.
 */

import { parseJSON } from '../utils/parseJSON';
import { AI_MODELS } from '../../config/constants';
import type { EntitySeed, VisualAnalysis, DeepProfile } from '../types';
import { getPrompt } from '../generation/prompts';

// Import new prompt templates
import { characterSeedPrompt, characterSeedDynamic } from '../generation/prompts/characters/characterSeed';
import { characterImagePrompt } from '../generation/prompts/characters/characterImage';
import { characterVisualAnalysisPrompt } from '../generation/prompts/characters/characterVisualAnalysis';
import { characterDeepProfilePrompt, characterDeepProfileDynamic } from '../generation/prompts/characters/characterDeepProfile';

// Import shared utilities
import { generateImage } from './shared/imageGeneration';
import { analyzeImageWithPrompt } from './shared/visualAnalysis';
import { PipelineHelper } from './shared/pipelineHelpers';
import { saveAndPinEntity, buildCharacterEntity } from './shared/entityPersistence';
import { generateCachedText, generateText } from '../../services/mzoo';

/**
 * Generate character seed
 * Uses cached generation for 90% cost reduction
 */
export async function generateCharacterSeed(
  userPrompt: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<EntitySeed> {
  const dynamicPrompt = characterSeedDynamic(userPrompt);
  
  let responseText: string;
  
  try {
    const cachedResult = await generateCachedText(
      apiKey,
      'morfeum-character-creation',
      dynamicPrompt
    );
    
    console.log(`[CharacterPipeline] Seed generation - cacheHit=${cachedResult.cacheHit}, cachedTokens=${cachedResult.usage?.cachedTokens || 0}`);
    responseText = cachedResult.text;
  } catch (cacheError) {
    console.warn('[CharacterPipeline] Cached seed generation failed, using fallback:', cacheError);
    // Fallback to non-cached generation
    const prompt = characterSeedPrompt(userPrompt);
    const messages = [
      { role: 'system', content: prompt },
      { role: 'user', content: userPrompt }
    ];

    const result = await generateText(
      apiKey,
      messages,
      AI_MODELS.SEED_GENERATION
    );

    if (result.error || !result.data) {
      throw new Error(result.error || 'No seed data returned');
    }
    responseText = result.data.text;
  }

  const seed = parseJSON<EntitySeed>(responseText);
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
 * Uses cached generation for 90% cost reduction
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

  const dynamicPrompt = characterDeepProfileDynamic(seedJson, visionJson, originalPrompt);
  
  let responseText: string;
  
  try {
    const cachedResult = await generateCachedText(
      apiKey,
      'morfeum-character-creation',
      dynamicPrompt
    );
    
    console.log(`[CharacterPipeline] Profile enrichment - cacheHit=${cachedResult.cacheHit}, cachedTokens=${cachedResult.usage?.cachedTokens || 0}`);
    responseText = cachedResult.text;
  } catch (cacheError) {
    console.warn('[CharacterPipeline] Cached profile enrichment failed, using fallback:', cacheError);
    // Fallback to non-cached generation
    const enrichmentPrompt = characterDeepProfilePrompt(seedJson, visionJson, originalPrompt);
    const messages = [
      { role: 'system', content: enrichmentPrompt },
      { role: 'user', content: 'Generate the complete character profile based on the provided data.' }
    ];

    const result = await generateText(
      apiKey,
      messages,
      AI_MODELS.PROFILE_ENRICHMENT
    );

    if (result.error || !result.data) {
      throw new Error(result.error || 'No profile data returned');
    }
    responseText = result.data.text;
  }

  const profile = parseJSON<DeepProfile>(responseText);
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
  signal?: AbortSignal,
  spawnId?: string
): Promise<{
  seed: EntitySeed;
  imageUrl: string;
  imagePrompt: string;
  visualAnalysis: VisualAnalysis;
  deepProfile: DeepProfile;
}> {
  const helper = spawnId ? new PipelineHelper(spawnId, 'CharacterPipeline', 'character') : null;

  try {
    if (helper) {
      helper.started('Starting character generation...');
    }

    // Step 1: Generate seed
    if (helper) {
      helper.startStage('seed_generation', 'Generating character seed...');
    }
    const seed = await generateCharacterSeed(userPrompt, apiKey, signal);
    if (helper) {
      helper.completeStage('seed_generation', 'Character seed generated', { seed });
    }
    
    // Step 2: Generate image
    if (helper) {
      helper.startStage('image_generation', 'Generating character image...');
    }
    const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey, signal);
    if (helper) {
      helper.completeStage('image_generation', 'Character image generated', { imageUrl });
    }
    
    // Step 3: Analyze image
    if (helper) {
      helper.startStage('visual_analysis', 'Analyzing character appearance...');
    }
    const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey, signal);
    if (helper) {
      helper.completeStage('visual_analysis', 'Character appearance analyzed', { analysis: visualAnalysis });
    }
    
    // Step 4: Enrich profile
    if (helper) {
      helper.startStage('profile_enrichment', 'Enriching character profile...');
    }
    const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey, signal);
    if (helper) {
      helper.completeStage('profile_enrichment', 'Character profile enriched');
    }

    // Save and pin character (if spawnId provided)
    if (spawnId && helper) {
      try {
        const character = buildCharacterEntity(
          spawnId,
          seed,
          visualAnalysis,
          deepProfile,
          imageUrl,
          imagePrompt
        );

        await saveAndPinEntity('character', character);

        helper.completed('Character created and saved successfully', { character });
      } catch (saveError) {
        console.error('[CharacterPipeline] Save failed:', saveError);
        helper.error(saveError as Error);
      }
    }

    return {
      seed,
      imageUrl,
      imagePrompt,
      visualAnalysis,
      deepProfile
    };
  } catch (error: any) {
    if (helper) {
      if (signal?.aborted) {
        helper.cancelled();
      } else {
        helper.error(error);
      }
    }
    throw error;
  }
}
