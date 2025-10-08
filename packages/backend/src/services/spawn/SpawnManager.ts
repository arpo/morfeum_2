/**
 * Spawn Manager
 * Orchestrates entity generation pipeline with cancellation support
 */

import { eventEmitter } from '../eventEmitter';
import { getPrompt } from '../../prompts';
import * as pipeline from './pipelineStages';
import { SpawnProcess, EntitySeed } from './types';

export class SpawnManager {
  private processes: Map<string, SpawnProcess> = new Map();
  private mzooApiKey: string;

  constructor(mzooApiKey: string) {
    this.mzooApiKey = mzooApiKey;
  }

  /**
   * Start a new spawn process
   */
  startSpawn(prompt: string): string {
    const spawnId = `spawn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();

    const process: SpawnProcess = {
      id: spawnId,
      prompt,
      status: 'generating_seed',
      createdAt: Date.now(),
      abortController
    };

    this.processes.set(spawnId, process);

    // Run pipeline asynchronously
    this.runPipeline(spawnId).catch((error) => {
      console.error(`[SpawnManager] Pipeline error for ${spawnId}:`, error);
    });

    return spawnId;
  }

  /**
   * Cancel a spawn process
   */
  cancelSpawn(spawnId: string): void {
    const process = this.processes.get(spawnId);
    if (!process) {
      return;
    }

    if (process.status === 'completed' || process.status === 'cancelled' || process.status === 'error') {
      return;
    }

    process.abortController.abort();
    process.status = 'cancelled';

    eventEmitter.emit({
      type: 'spawn:cancelled',
      data: { spawnId }
    });
  }

  /**
   * Get all active processes
   */
  getActiveProcesses(): SpawnProcess[] {
    return Array.from(this.processes.values()).filter(
      p => p.status !== 'completed' && p.status !== 'cancelled' && p.status !== 'error'
    );
  }

  /**
   * Run the complete entity generation pipeline
   */
  private async runPipeline(spawnId: string): Promise<void> {
    const process = this.processes.get(spawnId);
    if (!process) return;

    try {
      // Stage 1: Generate Seed
      process.status = 'generating_seed';
      
      const seed = await pipeline.generateSeed(
        this.mzooApiKey,
        process.prompt,
        process.abortController.signal
      );
      if (process.abortController.signal.aborted) return;

      process.seed = seed;

      // Generate initial system prompt from seed data
      const entityData = this.formatEntityData(seed);
      const systemPrompt = getPrompt('chatCharacterImpersonation', 'en')(entityData);

      // Emit seed complete event with system prompt
      eventEmitter.emit({
        type: 'spawn:seed-complete',
        data: { spawnId, seed, systemPrompt }
      });

      // Stage 2: Generate Image
      process.status = 'generating_image';

      const { imageUrl, imagePrompt } = await pipeline.generateImage(
        this.mzooApiKey,
        seed,
        process.abortController.signal
      );
      if (process.abortController.signal.aborted) return;

      process.imageUrl = imageUrl;
      process.imagePrompt = imagePrompt;

      // Emit image complete event
      eventEmitter.emit({
        type: 'spawn:image-complete',
        data: { spawnId, imageUrl, imagePrompt }
      });

      // Stage 3: Analyze Image
      process.status = 'analyzing';

      const visualAnalysis = await pipeline.analyzeImage(
        this.mzooApiKey,
        imageUrl,
        seed,
        process.abortController.signal
      );
      if (process.abortController.signal.aborted) return;

      process.visualAnalysis = visualAnalysis;

      // Emit analysis complete event
      eventEmitter.emit({
        type: 'spawn:analysis-complete',
        data: { spawnId, visualAnalysis }
      });

      // Stage 4: Enrich Profile
      process.status = 'enriching';

      const deepProfile = await pipeline.enrichProfile(
        this.mzooApiKey,
        seed,
        visualAnalysis,
        process.abortController.signal
      );
      if (process.abortController.signal.aborted) return;

      process.deepProfile = deepProfile;

      // Generate enhanced system prompt with full deep profile data
      const enhancedEntityData = this.formatEnhancedEntityData(deepProfile);
      const enhancedSystemPrompt = getPrompt('chatCharacterImpersonation', 'en')(enhancedEntityData);

      // Emit profile complete event with enhanced system prompt
      eventEmitter.emit({
        type: 'spawn:profile-complete',
        data: { 
          spawnId, 
          deepProfile,
          enhancedSystemPrompt
        }
      });

      // Mark as completed
      process.status = 'completed';

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        process.status = 'cancelled';
        return;
      }

      console.error(`[SpawnManager] ${spawnId}: Pipeline error:`, error);
      process.status = 'error';
      process.error = error instanceof Error ? error.message : 'Unknown error';

      eventEmitter.emit({
        type: 'spawn:error',
        data: { 
          spawnId, 
          error: process.error 
        }
      });
    }
  }

  /**
   * Format entity data from seed for system prompt
   */
  private formatEntityData(seed: EntitySeed): string {
    return `Name: ${seed.name}\nAppearance: ${seed.looks}\nWearing: ${seed.wearing}\nPersonality: ${seed.personality}`;
  }

  /**
   * Format enhanced entity data from deep profile for system prompt
   */
  private formatEnhancedEntityData(deepProfile: any): string {
    return `Name: \n${deepProfile.name} \n\nAppearance:\n${deepProfile.looks}\n\nFace:\n${deepProfile.face}\n\nBody:\n${deepProfile.body}\n\nHair:\n${deepProfile.hair}\n\nWearing:\n${deepProfile.wearing}\n\nSpecific Details:\n${deepProfile.specificDetails}\n\nStyle:\n${deepProfile.style}\n\nPersonality:\n${deepProfile.personality}\n\nSpeech Style:\n${deepProfile.speechStyle}\n\nGender: \n${deepProfile.gender}\n\nNationality:\n${deepProfile.nationality}`;
  }
}
