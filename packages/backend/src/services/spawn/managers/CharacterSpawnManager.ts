/**
 * Character Spawn Manager
 * Handles character-specific pipeline logic
 */

import { BasePipelineManager } from './BasePipelineManager';
import * as mzooService from '../../mzoo.service';
import { getPrompt } from '../../../prompts';
import { AI_MODELS } from '../../../config/constants';
import { ImageResult } from '../shared/types';
import { parseJSON, fetchImageAsBase64 } from '../shared/pipelineCommon';
import { EntitySeed, VisualAnalysis, DeepProfile } from '../types';

export class CharacterSpawnManager extends BasePipelineManager {
  getEntityType(): string {
    return 'character';
  }

  async generateSeed(
    prompt: string,
    signal: AbortSignal
  ): Promise<EntitySeed> {
    const systemPrompt = getPrompt('characterSeedGeneration', 'en')(prompt);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const result = await mzooService.generateText(
      this.mzooApiKey,
      messages,
      AI_MODELS.SEED_GENERATION
    );

    if (result.error) {
      throw new Error(result.error);
    }

    return parseJSON(result.data.text);
  }

  async generateImage(
    seed: EntitySeed,
    signal: AbortSignal
  ): Promise<ImageResult> {
    const imagePrompt = getPrompt('characterImageGeneration', 'en')(
      seed.originalPrompt || '',
      seed.name,
      seed.looks,
      seed.wearing,
      seed.personality,
      seed.presence,
      seed.setting,
      'Half Portrait'
    );

    const result = await mzooService.generateImage(
      this.mzooApiKey,
      imagePrompt,
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

    return { imageUrl, imagePrompt };
  }

  async analyzeImage(
    imageUrl: string,
    seed: EntitySeed,
    signal: AbortSignal
  ): Promise<VisualAnalysis> {
    const base64Image = await fetchImageAsBase64(imageUrl);

    const analysisPrompt = getPrompt('characterVisualAnalysis', 'en')(
      seed.name,
      seed.looks,
      seed.wearing,
      seed.personality,
      seed.presence
    );

    const result = await mzooService.analyzeImage(
      this.mzooApiKey,
      base64Image,
      analysisPrompt,
      'image/jpeg',
      AI_MODELS.VISUAL_ANALYSIS
    );

    if (result.error) {
      throw new Error(result.error);
    }

    return parseJSON(result.data.text);
  }

  async enrichProfile(
    seed: EntitySeed,
    visualAnalysis: VisualAnalysis,
    signal: AbortSignal
  ): Promise<DeepProfile> {
    const seedJson = JSON.stringify(seed, null, 2);
    const visionJson = JSON.stringify(visualAnalysis, null, 2);
    const originalPrompt = seed.originalPrompt || 'No specific request provided';

    const enrichmentPrompt = getPrompt('characterDeepProfileEnrichment', 'en')(
      seedJson,
      visionJson,
      originalPrompt
    );

    const messages = [
      { role: 'system', content: enrichmentPrompt },
      { role: 'user', content: 'Generate the complete character profile based on the provided data.' }
    ];

    const result = await mzooService.generateText(
      this.mzooApiKey,
      messages,
      AI_MODELS.PROFILE_ENRICHMENT
    );

    if (result.error) {
      throw new Error(result.error);
    }

    return parseJSON(result.data.text);
  }

  generateInitialSystemPrompt(seed: EntitySeed): string {
    const entityData = `Name: ${seed.name}\nAppearance: ${seed.looks}\nWearing: ${seed.wearing}\nPersonality: ${seed.personality}`;
    return getPrompt('chatCharacterImpersonation', 'en')(entityData);
  }

  generateEnhancedSystemPrompt(deepProfile: DeepProfile): string {
    const enhancedData = `Name: \n${deepProfile.name} \n\nAppearance:\n${deepProfile.looks}\n\nFace:\n${deepProfile.face}\n\nBody:\n${deepProfile.body}\n\nHair:\n${deepProfile.hair}\n\nWearing:\n${deepProfile.wearing}\n\nSpecific Details:\n${deepProfile.specificDetails}\n\nStyle:\n${deepProfile.style}\n\nPersonality:\n${deepProfile.personality}\n\nSpeech Style:\n${deepProfile.speechStyle}\n\nGender: \n${deepProfile.gender}\n\nNationality:\n${deepProfile.nationality}`;
    return getPrompt('chatCharacterImpersonation', 'en')(enhancedData);
  }
}
