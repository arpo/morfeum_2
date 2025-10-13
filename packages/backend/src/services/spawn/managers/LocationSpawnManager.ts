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

  /**
   * Generate image for sub-location with World DNA aesthetic guidance
   * Ensures generated image matches parent world's aesthetic while respecting the specific sub-location request
   */
  async generateImageForSubLocation(
    seed: LocationSeed,
    parentWorldDNA: Record<string, any>,
    signal: AbortSignal
  ): Promise<ImageResult> {
    // Build World DNA aesthetic guidance section
    const worldAesthetic = `
WORLD AESTHETIC (apply these qualities to the scene):
Genre/Style: ${parentWorldDNA.genre}
Architecture Style: ${parentWorldDNA.architecture}
Material Palette: ${parentWorldDNA.materials}
Lighting Style: ${parentWorldDNA.colorsAndLighting}
Atmospheric Quality: ${parentWorldDNA.atmosphere}
Flora Characteristics: ${parentWorldDNA.flora}
Fauna Characteristics: ${parentWorldDNA.fauna}`.trim();

    // Enhanced prompt with World DNA
    const { morfeumVibes, qualityPrompt } = await import('../../../prompts/languages/en/constants');
    
    // Use renderInstructions from seed
    const renderDirective = seed.renderInstructions || 'cinematic view, balanced composition, natural lighting';

    const imagePrompt = `${morfeumVibes}

${seed.name}, ${renderDirective}.

PRIMARY SUBJECT (what to depict):
Original user request: "${seed.originalPrompt || ''}"
Visual description: ${seed.looks}
Mood: ${seed.mood}

${worldAesthetic}

Guidelines:
- DEPICT the specific location requested by the user (${seed.originalPrompt || 'as described'})
- APPLY the world's aesthetic qualities listed above (genre, architecture style, materials, lighting, atmosphere)
- The world aesthetic defines HOW things look, not WHAT you depict
- Example: If user asks for "a bar" in a cyberpunk world → depict a bar WITH cyberpunk aesthetic
- Focus on the location itself, avoid including people or animals if not specified
- Ensure the scene matches the world's visual style while being the requested location

IMPORTANT:
- If water is present, depict it as calm and still if nothing else is specified
- Don't add a figure or person unless explicitly mentioned in the original prompt

${qualityPrompt}`;

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

  /**
   * Enrich profile for sub-location using World DNA lock approach
   * - Runs FULL enrichment (15 fields) for coherence
   * - Replaces 10 World DNA fields with parent's exact values (prevents drift)
   * - Returns complete profile with 5 fresh location fields + 10 inherited World DNA fields
   */
  async enrichProfileForSubLocation(
    seed: LocationSeed,
    visualAnalysis: LocationVisualAnalysis,
    parentWorldDNA: Record<string, any>,
    signal: AbortSignal
  ): Promise<LocationDeepProfile> {
    // Step 1: Run FULL enrichment (AI generates all 15 fields)
    const fullProfile = await this.enrichProfile(seed, visualAnalysis, signal);

    // Step 2: Lock World DNA - replace AI's 10 World DNA fields with parent's exact values
    const WORLD_DNA_KEYS = [
      'colorsAndLighting',
      'atmosphere',
      'flora',
      'fauna',
      'architecture',
      'materials',
      'genre',
      'symbolicThemes',
      'fictional',
      'copyright'
    ];

    // Overwrite World DNA fields with parent's values (zero drift guarantee)
    WORLD_DNA_KEYS.forEach(key => {
      if (key in parentWorldDNA) {
        (fullProfile as any)[key] = parentWorldDNA[key];
      }
    });

    // Return complete profile:
    // - 5 location-specific fields (name, looks, mood, sounds, airParticles) from AI
    // - 10 World DNA fields from parent (locked, no interpretation)
    return fullProfile;
  }

  /**
   * Override runPipeline to handle sub-locations
   */
  async runPipeline(
    spawnId: string,
    prompt: string,
    abortController: AbortController,
    parentLocationId?: string,
    parentWorldDNA?: Record<string, any>
  ): Promise<void> {
    // If this is a sub-location, use custom pipeline
    if (parentLocationId && parentWorldDNA) {
      return this.runSubLocationPipeline(
        spawnId,
        prompt,
        abortController,
        parentWorldDNA
      );
    }
    
    // Otherwise use standard pipeline
    return super.runPipeline(spawnId, prompt, abortController);
  }

  /**
   * Run pipeline for sub-locations (only generates 5 location-specific fields)
   */
  private async runSubLocationPipeline(
    spawnId: string,
    prompt: string,
    abortController: AbortController,
    parentWorldDNA: Record<string, any>
  ): Promise<void> {
    try {
      // Stage 1: Generate Seed (same as root location)
      const seed = await this.generateSeed(prompt, abortController.signal);
      if (abortController.signal.aborted) return;

      eventEmitter.emit({
        type: 'spawn:seed-complete',
        data: { spawnId, seed, systemPrompt: '', entityType: 'location' }
      });

      // Stage 2: Generate Image WITH World DNA constraints
      const { imageUrl, imagePrompt } = await this.generateImageForSubLocation(
        seed,
        parentWorldDNA,
        abortController.signal
      );
      if (abortController.signal.aborted) return;

      eventEmitter.emit({
        type: 'spawn:image-complete',
        data: { spawnId, imageUrl, imagePrompt, entityType: 'location' }
      });

      // Stage 3: Analyze Image (same as root location)
      const visualAnalysis = await this.analyzeImage(
        imageUrl,
        seed,
        abortController.signal
      );
      if (abortController.signal.aborted) return;

      eventEmitter.emit({
        type: 'spawn:analysis-complete',
        data: { spawnId, visualAnalysis, entityType: 'location' }
      });

      // Stage 4: Enrich Profile FOR SUB-LOCATION (only 5 fields)
      const locationInstance = await this.enrichProfileForSubLocation(
        seed,
        visualAnalysis,
        parentWorldDNA,
        abortController.signal
      );
      if (abortController.signal.aborted) return;

      // Merge World DNA with Location Instance for complete profile
      const completeProfile = {
        ...parentWorldDNA,
        ...locationInstance
      };

      eventEmitter.emit({
        type: 'spawn:profile-complete',
        data: { 
          spawnId, 
          deepProfile: completeProfile,
          enhancedSystemPrompt: '',
          entityType: 'location',
          isSubLocation: true
        }
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      throw error;
    }
  }

  // Locations don't have system prompts for chat
  // These methods are intentionally not implemented
}
