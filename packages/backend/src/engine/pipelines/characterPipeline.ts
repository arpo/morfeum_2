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
import { sseService } from '../../services/SSEService';
import { storageService } from '../../services/storage/storageService';

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
  signal?: AbortSignal,
  spawnId?: string
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

  try {
    console.log(`[CharacterPipeline] Starting pipeline for ${spawnId || 'character'}`);
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'started', 
        message: 'Starting character generation...' 
      });
    }

    // Step 1: Generate seed
    const seedStart = Date.now();
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'seed_generation', 
        message: 'Generating character seed...' 
      });
    }
    const seed = await generateCharacterSeed(userPrompt, apiKey, signal);
    timings.seedGeneration = Date.now() - seedStart;

    console.log(`[CharacterPipeline] ${spawnId || 'character'} Seed generation complete`);
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'seed_complete', 
        message: 'Character seed generated',
        data: { seed } 
      });
    }
    
    // Step 2: Generate image
    const imageStart = Date.now();
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'image_generation', 
        message: 'Generating character image...' 
      });
    }
    const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey, signal);
    timings.imageGeneration = Date.now() - imageStart;

    console.log(`[CharacterPipeline] ${spawnId || 'character'} Image generation complete`);
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'image_complete', 
        message: 'Character image generated',
        data: { imageUrl } 
      });
    }
    
    // Step 3: Analyze image
    const analysisStart = Date.now();
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'visual_analysis', 
        message: 'Analyzing character appearance...' 
      });
    }
    const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey, signal);
    timings.visualAnalysis = Date.now() - analysisStart;

    console.log(`[CharacterPipeline] ${spawnId || 'character'} Visual analysis complete`);
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'analysis_complete', 
        message: 'Character appearance analyzed',
        data: { analysis: visualAnalysis } 
      });
    }
    
    // Step 4: Enrich profile
    const enrichStart = Date.now();
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'profile_enrichment', 
        message: 'Enriching character profile...' 
      });
    }
    const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey, signal);
    timings.profileEnrichment = Date.now() - enrichStart;

    console.log(`[CharacterPipeline] ${spawnId || 'character'} Profile enrichment complete`);
    if (spawnId) {
      sseService.sendEvent(spawnId, 'progress', { 
        stage: 'profile_complete', 
        message: 'Character profile enriched' 
      });
    }

    const totalTime = Date.now() - pipelineStartTime;

    // Log completion with timing breakdown
    console.log(`\n[CharacterPipeline] ${spawnId || 'character'} completed in ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Entity Type: character`);
    console.log(`  Stage Timings:`);
    console.log(`    - Seed Generation:     ${(timings.seedGeneration / 1000).toFixed(2)}s`);
    console.log(`    - Image Generation:    ${(timings.imageGeneration / 1000).toFixed(2)}s`);
    console.log(`    - Visual Analysis:     ${(timings.visualAnalysis / 1000).toFixed(2)}s`);
    console.log(`    - Profile Enrichment:  ${(timings.profileEnrichment / 1000).toFixed(2)}s`);
    console.log(`  Total:                   ${(totalTime / 1000).toFixed(2)}s\n`);

    if (spawnId) {
      // Auto-save character to backend storage
      try {
        console.log(`[CharacterPipeline] Saving character to backend: ${spawnId}`);
        
        // Load existing characters
        const existingData = await storageService.loadCharacters() || {
          characters: {},
          pinnedIds: []
        };

        // Build character object matching characters.json format
        const character = {
          id: spawnId,
          name: seed.name,
          details: {
            name: seed.name,
            looks: seed.looks,
            wearing: seed.wearing || '',
            face: visualAnalysis.face || '',
            body: visualAnalysis.body || '',
            hair: visualAnalysis.hair || '',
            specificDetails: visualAnalysis.specificDetails || '',
            style: deepProfile.style || '',
            personality: seed.personality || deepProfile.personality || '',
            voice: deepProfile.voice || '',
            speechStyle: deepProfile.speechStyle || '',
            gender: deepProfile.gender || '',
            nationality: deepProfile.nationality || '',
            fictional: deepProfile.fictional || true,
            copyright: deepProfile.copyright || false,
            tags: deepProfile.tags || '',
            imageUrl,
            imagePrompt,
            seed,
            visualAnalysis
          },
          imagePath: imageUrl
        };

        // Save to backend storage and pin character
        existingData.characters[spawnId] = character;
        
        // Add to pinnedIds if not already there
        if (!existingData.pinnedIds.includes(spawnId)) {
          existingData.pinnedIds.push(spawnId);
        }
        
        await storageService.saveCharacters(existingData);
        
        console.log(`[CharacterPipeline] Character saved and pinned successfully: ${spawnId}`);

        // Send completed event with saved character
        sseService.sendEvent(spawnId, 'completed', { 
          message: 'Character created and saved successfully',
          character,
          timings
        });

      } catch (saveError) {
        console.error(`[CharacterPipeline] Failed to save character:`, saveError);
        
        // Still send completed event even if save fails
        sseService.sendEvent(spawnId, 'completed', { 
          message: 'Character created (save failed)',
          character: {
            id: spawnId,
            name: seed.name,
            details: {
              name: seed.name,
              looks: seed.looks,
              imageUrl,
              imagePrompt,
              seed,
              visualAnalysis,
              deepProfile
            },
            imagePath: imageUrl
          },
          timings,
          saveError: saveError instanceof Error ? saveError.message : 'Unknown error'
        });
      }

      // Close connection after completion
      setTimeout(() => sseService.closeConnection(spawnId), 1000);
    }

    return {
      seed,
      imageUrl,
      imagePrompt,
      visualAnalysis,
      deepProfile
    };
  } catch (error: any) {
    console.error(`[CharacterPipeline] Pipeline failed:`, error);
    if (spawnId) {
      sseService.sendEvent(spawnId, 'error', { 
        message: 'Pipeline failed', 
        error: error.message 
      });
      sseService.closeConnection(spawnId);
    }
    throw error;
  }
}
