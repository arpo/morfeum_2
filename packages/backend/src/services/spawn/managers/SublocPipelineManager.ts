/**
 * Sublocation Pipeline Manager
 * Simplified pipeline for generating sublocations from parent location context
 */

import * as mzooService from '../../mzoo.service';
import { generateSublocationDNA as generateSublocationPrompt } from '../../../prompts/languages/en/sublocationGeneration';
import { sublocationImageGeneration } from '../../../prompts/languages/en/sublocationImageGeneration';
import { locationImageGeneration } from '../../../prompts/languages/en/locationImageGeneration';
import { AI_MODELS } from '../../../config/constants';
import { parseJSON } from '../shared/pipelineCommon';
import { eventEmitter } from '../../eventEmitter';

interface SublocPipelineOptions {
  spawnId: string;
  sublocationName: string;
  parentNodeId: string;
  cascadedContext: any;
  createImage: boolean;
  scaleHint?: 'macro' | 'area' | 'site' | 'interior' | 'detail';
  mzooApiKey: string;
}

export class SublocPipelineManager {
  private spawnId: string;
  private sublocationName: string;
  private parentNodeId: string;
  private cascadedContext: any;
  private createImage: boolean;
  private scaleHint: 'macro' | 'area' | 'site' | 'interior' | 'detail';
  private mzooApiKey: string;
  private abortController: AbortController;

  constructor(options: SublocPipelineOptions) {
    this.spawnId = options.spawnId;
    this.sublocationName = options.sublocationName;
    this.parentNodeId = options.parentNodeId;
    this.cascadedContext = options.cascadedContext;
    this.createImage = options.createImage;
    this.scaleHint = options.scaleHint || 'interior';
    this.mzooApiKey = options.mzooApiKey;
    this.abortController = new AbortController();
    
    console.log('[SublocPipeline] 🏗️ Constructor initialized with:', {
      spawnId: this.spawnId,
      sublocationName: this.sublocationName,
      scaleHint: this.scaleHint,
      receivedScaleHint: options.scaleHint,
      willCreateImage: this.createImage
    });
  }

  async run(): Promise<void> {
    const pipelineStartTime = Date.now();
    const timings = {
      dnaGeneration: 0,
      imageGeneration: 0
    };

    try {
      console.log('[SublocPipeline] ▶️ Starting sublocation generation:', {
        name: this.sublocationName,
        scaleHint: this.scaleHint
      });

      // Stage 1: Generate DNA
      const dnaStartTime = Date.now();
      const dna = await this.generateDNA();
      timings.dnaGeneration = Date.now() - dnaStartTime;
      
      // Emit DNA complete event with parentNodeId so frontend can build inherited DNA
      eventEmitter.emit({
        type: 'spawn:sublocation-dna-complete',
        data: {
          spawnId: this.spawnId,
          dna,
          parentNodeId: this.parentNodeId
        }
      });

      // Stage 2: Generate Image (if requested)
      let imageUrl = '';
      if (this.createImage) {
        console.log('[SublocPipeline] Generating image for sublocation...');
        const imageStartTime = Date.now();
        imageUrl = await this.generateImage(dna);
        timings.imageGeneration = Date.now() - imageStartTime;
        
        // Emit image complete event
        eventEmitter.emit({
          type: 'spawn:sublocation-image-complete',
          data: {
            spawnId: this.spawnId,
            imageUrl
          }
        });
      }

      // Stage 3: Complete
      eventEmitter.emit({
        type: 'spawn:sublocation-complete',
        data: {
          spawnId: this.spawnId,
          dna,
          imageUrl,
          parentNodeId: this.parentNodeId
        }
      });

      // Log completion with timing (matching BasePipelineManager format)
      const totalTime = Date.now() - pipelineStartTime;
      console.log(`\n[SublocPipelineManager] ${this.spawnId} completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Entity Type: sublocation`);
      console.log(`  Stage Timings:`);
      console.log(`    - DNA Generation:      ${(timings.dnaGeneration / 1000).toFixed(2)}s`);
      if (this.createImage) {
        console.log(`    - Image Generation:    ${(timings.imageGeneration / 1000).toFixed(2)}s`);
      }
      console.log(`  Total:                   ${(totalTime / 1000).toFixed(2)}s\n`);

    } catch (error: any) {
      console.error('[SublocPipeline] Error:', error);
      eventEmitter.emit({
        type: 'spawn:error',
        data: {
          spawnId: this.spawnId,
          error: error.message
        }
      });
      throw error;
    }
  }

  private async generateDNA(): Promise<any> {
    console.log('[SublocPipeline] 🧬 Generating DNA with scale_hint:', this.scaleHint);
    
    const prompt = generateSublocationPrompt(
      this.sublocationName,
      this.cascadedContext,
      this.scaleHint
    );

    const result = await mzooService.generateText(
      this.mzooApiKey,
      [{ role: 'user', content: prompt }],
      AI_MODELS.PROFILE_ENRICHMENT
    );

    if (result.error || !result.data) {
      throw new Error(`Failed to generate sublocation DNA: ${result.error || 'No response'}`);
    }

    // Parse JSON response - MZOO service returns {text: "...", model: "...", usage: {}}
    let jsonText: string;
    if (typeof result.data === 'string') {
      jsonText = result.data;
    } else if (result.data && typeof result.data === 'object' && 'text' in result.data) {
      jsonText = (result.data as any).text;
    } else {
      jsonText = JSON.stringify(result.data);
    }

    return parseJSON(jsonText);
  }

  private async generateImage(dna: any): Promise<string> {
    // Choose the correct image generation prompt based on scale_hint
    let imagePrompt: string;
    
    if (this.scaleHint === 'interior' || this.scaleHint === 'detail') {
      // Use interior-focused prompt for actual interior spaces and detail views
      console.log('[SublocPipeline] Using interior image prompt for scale:', this.scaleHint);
      imagePrompt = sublocationImageGeneration(
        dna.meta.name,
        dna.profile.looks,
        dna.profile.atmosphere,
        dna.profile.colorsAndLighting,
        dna.profile.mood,
        dna.profile.viewContext
      );
    } else {
      // Use exterior-focused prompt for site, area, macro scales
      console.log('[SublocPipeline] Using exterior image prompt for scale:', this.scaleHint);
      imagePrompt = locationImageGeneration(
        dna.meta.name,
        dna.profile.looks,
        dna.profile.atmosphere,
        dna.profile.colorsAndLighting,
        dna.profile.mood,
        dna.profile.viewContext
      );
    }

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

    return imageUrl;
  }

  cancel(): void {
    this.abortController.abort();
  }
}
