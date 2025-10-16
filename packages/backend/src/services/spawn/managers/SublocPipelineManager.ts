/**
 * Sublocation Pipeline Manager
 * Simplified pipeline for generating sublocations from parent location context
 */

import * as mzooService from '../../mzoo.service';
import { generateSublocationDNA as generateSublocationPrompt } from '../../../prompts/languages/en/sublocationGeneration';
import { sublocationImagePromptGeneration } from '../../../prompts/languages/en/sublocationImagePromptGeneration';
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
    
    // console.log('[SublocPipeline] 🏗️ Constructor initialized with:', {
    //   spawnId: this.spawnId,
    //   sublocationName: this.sublocationName,
    //   scaleHint: this.scaleHint,
    //   receivedScaleHint: options.scaleHint,
    //   willCreateImage: this.createImage
    // });
  }

  async run(): Promise<void> {
    try {
      // console.log('[SublocPipeline] ▶️ Starting sublocation generation:', {
      //   name: this.sublocationName,
      //   scaleHint: this.scaleHint
      // });

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
        // Stage 2a: Generate FLUX prompt via LLM
        const fluxPrompt = await this.generateImagePrompt(dna);
        
        console.log('[SublocPipeline] ✨ Generated FLUX Prompt:');
        console.log('---START FLUX PROMPT---');
        console.log(fluxPrompt);
        console.log('---END FLUX PROMPT---');
        
        // Emit image prompt generated event
        eventEmitter.emit({
          type: 'spawn:sublocation-image-prompt-complete',
          data: {
            spawnId: this.spawnId,
            imagePrompt: fluxPrompt
          }
        });
        
        // Stage 2b: Generate image using LLM-generated prompt
        imageUrl = await this.generateImage(fluxPrompt);
        
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
    // console.log('[SublocPipeline] 🧬 Generating DNA with scale_hint:', this.scaleHint);
    
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

  private async generateImagePrompt(dna: any): Promise<string> {
    const prompt = sublocationImagePromptGeneration(dna, this.cascadedContext);

    const result = await mzooService.generateText(
      this.mzooApiKey,
      [{ role: 'user', content: prompt }],
      AI_MODELS.PROFILE_ENRICHMENT
    );

    if (result.error || !result.data) {
      throw new Error(`Failed to generate image prompt: ${result.error || 'No response'}`);
    }

    // Extract text from response
    let fluxPrompt: string;
    if (typeof result.data === 'string') {
      fluxPrompt = result.data;
    } else if (result.data && typeof result.data === 'object' && 'text' in result.data) {
      fluxPrompt = (result.data as any).text;
    } else {
      fluxPrompt = JSON.stringify(result.data);
    }

    return fluxPrompt.trim();
  }

  private async generateImage(fluxPrompt: string): Promise<string> {
    const result = await mzooService.generateImage(
      this.mzooApiKey,
      fluxPrompt,
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
