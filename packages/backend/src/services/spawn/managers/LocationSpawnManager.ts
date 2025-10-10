/**
 * Location Spawn Manager
 * Handles location-specific pipeline logic
 */

import { BasePipelineManager } from './BasePipelineManager';
import * as mzooService from '../../mzoo.service';
import { getPrompt } from '../../../prompts';
import { AI_MODELS } from '../../../config/constants';
import { ImageResult } from '../shared/types';
import { parseJSON, fetchImageAsBase64 } from '../shared/pipelineCommon';
import { LocationSeed, LocationVisualAnalysis, LocationDeepProfile } from '../types';

export class LocationSpawnManager extends BasePipelineManager {
  getEntityType(): string {
    return 'location';
  }

  async generateSeed(
    prompt: string,
    signal: AbortSignal
  ): Promise<LocationSeed> {
    const systemPrompt = getPrompt('locationSeedGeneration', 'en')(prompt);
    
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
    seed: LocationSeed,
    signal: AbortSignal
  ): Promise<ImageResult> {
    const imagePrompt = getPrompt('locationImageGeneration', 'en')(
      seed.originalPrompt || '',
      seed.name,
      seed.looks,
      seed.atmosphere,
      seed.mood,
      'Landscape Overview'
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
    seed: LocationSeed,
    signal: AbortSignal
  ): Promise<LocationVisualAnalysis> {
    const base64Image = await fetchImageAsBase64(imageUrl);

    const analysisPrompt = getPrompt('locationVisualAnalysis', 'en')(
      seed.name,
      seed.looks,
      seed.atmosphere,
      seed.mood
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
    seed: LocationSeed,
    visualAnalysis: LocationVisualAnalysis,
    signal: AbortSignal
  ): Promise<LocationDeepProfile> {
    const seedJson = JSON.stringify(seed, null, 2);
    const visionJson = JSON.stringify(visualAnalysis, null, 2);
    const originalPrompt = seed.originalPrompt || 'No specific request provided';

    const enrichmentPrompt = getPrompt('locationDeepProfileEnrichment', 'en')(
      seedJson,
      visionJson,
      originalPrompt
    );

    const messages = [
      { role: 'system', content: enrichmentPrompt },
      { role: 'user', content: 'Generate the complete location profile based on the provided data.' }
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

  // Locations don't have system prompts for chat
  // These methods are intentionally not implemented
}
