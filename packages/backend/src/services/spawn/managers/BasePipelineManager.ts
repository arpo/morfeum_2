/**
 * Base Pipeline Manager
 * Abstract base class for all entity-specific pipeline managers
 */

import { eventEmitter } from '../../eventEmitter';
import { ImageResult, PipelineTimings } from '../shared/types';

export abstract class BasePipelineManager {
  constructor(protected mzooApiKey: string) {}

  /**
   * Get entity type identifier
   */
  abstract getEntityType(): string;

  /**
   * Generate seed from user prompt
   */
  abstract generateSeed(
    prompt: string,
    signal: AbortSignal
  ): Promise<any>;

  /**
   * Generate image from seed
   */
  abstract generateImage(
    seed: any,
    signal: AbortSignal
  ): Promise<ImageResult>;

  /**
   * Analyze generated image
   */
  abstract analyzeImage(
    imageUrl: string,
    seed: any,
    signal: AbortSignal
  ): Promise<any>;

  /**
   * Enrich profile with deep details
   */
  abstract enrichProfile(
    seed: any,
    visualAnalysis: any,
    signal: AbortSignal
  ): Promise<any>;

  /**
   * Generate initial system prompt (optional, for character-like entities)
   */
  generateInitialSystemPrompt?(seed: any): string;

  /**
   * Generate enhanced system prompt (optional, for character-like entities)
   */
  generateEnhancedSystemPrompt?(deepProfile: any): string;

  /**
   * Run the complete pipeline for this entity type
   */
  async runPipeline(
    spawnId: string,
    prompt: string,
    abortController: AbortController,
    options?: { skipVisualAnalysis?: boolean }
  ): Promise<void> {
    const pipelineStartTime = Date.now();
    const skipVisualAnalysis = options?.skipVisualAnalysis ?? false;
    const timings: PipelineTimings = {
      seedGeneration: 0,
      imageGeneration: 0,
      visualAnalysis: 0,
      profileEnrichment: 0
    };

    try {
      // Stage 1: Generate Seed
      const seedStartTime = Date.now();
      const seed = await this.generateSeed(prompt, abortController.signal);
      if (abortController.signal.aborted) return;
      timings.seedGeneration = Date.now() - seedStartTime;

      // Generate initial system prompt (if applicable)
      let systemPrompt = '';
      if (this.generateInitialSystemPrompt) {
        systemPrompt = this.generateInitialSystemPrompt(seed);
      }

      // Emit seed complete event
      eventEmitter.emit({
        type: 'spawn:seed-complete',
        data: { 
          spawnId, 
          seed, 
          systemPrompt, 
          entityType: this.getEntityType() 
        }
      });

      // Stage 2: Generate Image
      const imageStartTime = Date.now();
      const { imageUrl, imagePrompt } = await this.generateImage(
        seed,
        abortController.signal
      );
      if (abortController.signal.aborted) return;
      timings.imageGeneration = Date.now() - imageStartTime;

      // Emit image complete event
      eventEmitter.emit({
        type: 'spawn:image-complete',
        data: { 
          spawnId, 
          imageUrl, 
          imagePrompt, 
          entityType: this.getEntityType() 
        }
      });

      // Stage 3: Analyze Image (optional - can be skipped for faster generation)
      let visualAnalysis: any;
      if (skipVisualAnalysis) {
        console.log(`[${this.constructor.name}] ⚡ Skipping visual analysis (fast mode)`);
        // Use seed data as fallback for visual analysis
        visualAnalysis = seed;
      } else {
        const analysisStartTime = Date.now();
        visualAnalysis = await this.analyzeImage(
          imageUrl,
          seed,
          abortController.signal
        );
        if (abortController.signal.aborted) return;
        timings.visualAnalysis = Date.now() - analysisStartTime;

        // Emit analysis complete event
        eventEmitter.emit({
          type: 'spawn:analysis-complete',
          data: { 
            spawnId, 
            visualAnalysis, 
            entityType: this.getEntityType() 
          }
        });
      }

      // Stage 4: Enrich Profile
      const enrichStartTime = Date.now();
      const deepProfile = await this.enrichProfile(
        seed,
        visualAnalysis,
        abortController.signal
      );
      if (abortController.signal.aborted) return;
      timings.profileEnrichment = Date.now() - enrichStartTime;

      // Generate enhanced system prompt (if applicable)
      let enhancedSystemPrompt = '';
      if (this.generateEnhancedSystemPrompt) {
        enhancedSystemPrompt = this.generateEnhancedSystemPrompt(deepProfile);
      }

      // Emit profile complete event
      eventEmitter.emit({
        type: 'spawn:profile-complete',
        data: { 
          spawnId, 
          deepProfile,
          enhancedSystemPrompt,
          entityType: this.getEntityType()
        }
      });

      // Log completion
      const totalTime = Date.now() - pipelineStartTime;
      console.log(`\n[${this.constructor.name}] ${spawnId} completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Entity Type: ${this.getEntityType()}`);
      console.log(`  Stage Timings:`);
      console.log(`    - Seed Generation:     ${(timings.seedGeneration / 1000).toFixed(2)}s`);
      console.log(`    - Image Generation:    ${(timings.imageGeneration / 1000).toFixed(2)}s`);
      if (skipVisualAnalysis) {
        console.log(`    - Visual Analysis:     SKIPPED (fast mode)`);
      } else {
        console.log(`    - Visual Analysis:     ${(timings.visualAnalysis / 1000).toFixed(2)}s`);
      }
      console.log(`    - Profile Enrichment:  ${(timings.profileEnrichment / 1000).toFixed(2)}s`);
      console.log(`  Total:                   ${(totalTime / 1000).toFixed(2)}s\n`);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      throw error; // Re-throw other errors
    }
  }
}
