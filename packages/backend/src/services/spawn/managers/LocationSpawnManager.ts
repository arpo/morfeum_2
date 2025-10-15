/**
 * Location Spawn Manager
 * Handles location-specific pipeline logic
 */

import { BasePipelineManager } from './BasePipelineManager';
import * as mzooService from '../../mzoo';
import { getPrompt } from '../../../prompts';
import { AI_MODELS } from '../../../config/constants';
import { ImageResult } from '../shared/types';
import { parseJSON, fetchImageAsBase64 } from '../shared/pipelineCommon';
import { LocationSeed, LocationVisualAnalysis, LocationDeepProfile, NodeDNA } from '../types';
import { eventEmitter } from '../../eventEmitter';

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

    if (result.error || !result.data) {
      throw new Error(result.error || 'No data returned from API');
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
      seed.renderInstructions
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

    if (result.error || !result.data) {
      throw new Error(result.error || 'No data returned from API');
    }

    return parseJSON(result.data.text);
  }

  async enrichProfile(
    seed: LocationSeed,
    visualAnalysis: LocationVisualAnalysis,
    signal: AbortSignal
  ): Promise<NodeDNA> {
    const seedJson = JSON.stringify(seed, null, 2);
    const visionJson = JSON.stringify(visualAnalysis, null, 2);
    const originalPrompt = seed.originalPrompt || 'No specific request provided';

    // NEW: Simplified flat DNA structure
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

    if (result.error || !result.data) {
      throw new Error(result.error || 'No data returned from API');
    }

    // Parse simplified NodeDNA structure
    const nodeDNA: NodeDNA = parseJSON(result.data.text);
    
    // OPTIONAL: Generate view descriptions for multi-view support
    // This is prepared for future use but not yet fully integrated
    // Uncomment when ready to enable multi-view navigation
    /*
    try {
      const viewDescriptions = await this.generateViewDescriptions(
        seed,
        visualAnalysis,
        signal
      );
      nodeDNA.viewDescriptions = viewDescriptions;
    } catch (error) {
      console.log('[LocationSpawnManager] View descriptions generation failed (optional):', error);
      // Continue without view descriptions - not critical
    }
    */
    
    return nodeDNA;
  }

  /**
   * OPTIONAL: Generate text descriptions for different viewpoints
   * Prepares infrastructure for multi-view navigation without generating images upfront
   * Images will be generated lazily when user looks in that direction
   */
  async generateViewDescriptions(
    seed: LocationSeed,
    visualAnalysis: LocationVisualAnalysis,
    signal: AbortSignal
  ): Promise<Record<string, any>> {
    const seedJson = JSON.stringify(seed, null, 2);
    const visionJson = JSON.stringify(visualAnalysis, null, 2);
    const renderInstructions = seed.renderInstructions || '';

    const viewPrompt = getPrompt('generateViewDescriptions', 'en')(
      seedJson,
      visionJson,
      renderInstructions
    );

    const messages = [
      { role: 'system', content: viewPrompt },
      { role: 'user', content: 'Generate view descriptions for all directions.' }
    ];

    const result = await mzooService.generateText(
      this.mzooApiKey,
      messages,
      AI_MODELS.SEED_GENERATION // Fast model for text generation
    );

    if (result.error || !result.data) {
      throw new Error(result.error || 'No data returned from API');
    }

    return parseJSON(result.data.text);
  }


  // Locations don't have system prompts for chat
  // These methods are intentionally not implemented
}
