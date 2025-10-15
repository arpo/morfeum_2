/**
 * Sublocation Pipeline Manager
 * Simplified pipeline for generating sublocations from parent location context
 */

import * as mzooService from '../../mzoo.service';
import { generateSublocationDNA as generateSublocationPrompt } from '../../../prompts/languages/en/sublocationGeneration';
import { sublocationImageGeneration } from '../../../prompts/languages/en/sublocationImageGeneration';
import { AI_MODELS } from '../../../config/constants';
import { parseJSON } from '../shared/pipelineCommon';
import { eventEmitter } from '../../eventEmitter';

interface SublocPipelineOptions {
  spawnId: string;
  sublocationName: string;
  parentNodeId: string;
  cascadedContext: any;
  createImage: boolean;
  mzooApiKey: string;
}

export class SublocPipelineManager {
  private spawnId: string;
  private sublocationName: string;
  private parentNodeId: string;
  private cascadedContext: any;
  private createImage: boolean;
  private mzooApiKey: string;
  private abortController: AbortController;

  constructor(options: SublocPipelineOptions) {
    this.spawnId = options.spawnId;
    this.sublocationName = options.sublocationName;
    this.parentNodeId = options.parentNodeId;
    this.cascadedContext = options.cascadedContext;
    this.createImage = options.createImage;
    this.mzooApiKey = options.mzooApiKey;
    this.abortController = new AbortController();
  }

  async run(): Promise<void> {
    try {
      console.log('[SublocPipeline] Starting sublocation generation:', this.sublocationName);

      // Stage 1: Generate DNA
      const dna = await this.generateDNA();
      
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
        imageUrl = await this.generateImage(dna);
        
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
      // console.log('[SublocPipeline] Sublocation generation complete');
      eventEmitter.emit({
        type: 'spawn:sublocation-complete',
        data: {
          spawnId: this.spawnId,
          dna,
          imageUrl,
          parentNodeId: this.parentNodeId
        }
      });

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
    const prompt = generateSublocationPrompt(
      this.sublocationName,
      this.cascadedContext
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
    const imagePrompt = sublocationImageGeneration(
      dna.meta.name,
      dna.profile.looks,
      dna.profile.atmosphere,
      dna.profile.colorsAndLighting,
      dna.profile.mood,
      dna.profile.viewContext
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

    return imageUrl;
  }

  cancel(): void {
    this.abortController.abort();
  }
}
