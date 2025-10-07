/**
 * Spawn Manager Service
 * Manages entity generation pipelines with cancellation support
 */

import { eventEmitter } from './eventEmitter';
import * as mzooService from './mzoo.service';
import { getPrompt } from '../prompts';

interface EntitySeed {
  originalPrompt?: string;
  name: string;
  looks: string;
  wearing: string;
  personality: string;
  presence?: string;
  setting?: string;
}

interface VisualAnalysis {
  face: string;
  hair: string;
  body: string;
  specificdetails: string;
}

interface DeepProfile {
  name: string;
  looks: string;
  wearing: string;
  face: string;
  body: string;
  hair: string;
  specificDetails: string;
  style: string;
  personality: string;
  voice: string;
  speechStyle: string;
  gender: string;
  nationality: string;
  fictional: string;
  copyright: string;
  tags: string;
}

interface SpawnProcess {
  id: string;
  prompt: string;
  status: 'generating_seed' | 'generating_image' | 'analyzing' | 'enriching' | 'completed' | 'cancelled' | 'error';
  seed?: Partial<EntitySeed>;
  imageUrl?: string;
  visualAnalysis?: VisualAnalysis;
  deepProfile?: DeepProfile;
  error?: string;
  createdAt: number;
  abortController: AbortController;
}

class SpawnManager {
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
      
      const seed = await this.generateSeed(process.prompt, process.abortController.signal);
      if (process.abortController.signal.aborted) return;

      process.seed = seed;

      // Generate initial system prompt from seed data
      const entityData = `Name: ${seed.name}\nAppearance: ${seed.looks}\nWearing: ${seed.wearing}\nPersonality: ${seed.personality}`;
      const systemPrompt = getPrompt('chatCharacterImpersonation', 'en')(entityData);

      // Emit seed complete event with system prompt
      eventEmitter.emit({
        type: 'spawn:seed-complete',
        data: { spawnId, seed, systemPrompt }
      });

      // Stage 2: Generate Image
      process.status = 'generating_image';

      const imageUrl = await this.generateImage(seed, process.abortController.signal);
      if (process.abortController.signal.aborted) return;

      process.imageUrl = imageUrl;

      // Emit image complete event
      eventEmitter.emit({
        type: 'spawn:image-complete',
        data: { spawnId, imageUrl }
      });

      // Stage 3: Analyze Image
      process.status = 'analyzing';

      const visualAnalysis = await this.analyzeImage(imageUrl, seed, process.abortController.signal);
      if (process.abortController.signal.aborted) return;

      process.visualAnalysis = visualAnalysis;

      // Emit analysis complete event
      eventEmitter.emit({
        type: 'spawn:analysis-complete',
        data: { spawnId, visualAnalysis }
      });

      // Stage 4: Enrich Profile
      process.status = 'enriching';

      const deepProfile = await this.enrichProfile(seed, visualAnalysis, process.abortController.signal);
      if (process.abortController.signal.aborted) return;

      process.deepProfile = deepProfile;

      // Emit profile complete event (system prompt already sent with seed)
      eventEmitter.emit({
        type: 'spawn:profile-complete',
        data: { 
          spawnId, 
          deepProfile
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
   * Generate entity seed
   */
  private async generateSeed(textPrompt: string, signal: AbortSignal): Promise<EntitySeed> {
    const systemPrompt = getPrompt('entitySeedGeneration', 'en')(textPrompt);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: textPrompt }
    ];

    const result = await mzooService.generateText(
      this.mzooApiKey,
      messages,
      'gemini-2.5-flash-lite'
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // Parse JSON response
    const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate entity image
   */
  private async generateImage(seed: EntitySeed, signal: AbortSignal): Promise<string> {
    const imagePrompt = getPrompt('entityImageGeneration', 'en')(
      seed.originalPrompt || '',
      seed.name,
      seed.looks,
      seed.wearing,
      seed.personality,
      seed.presence,
      seed.setting
    );

    const result = await mzooService.generateImage(
      this.mzooApiKey,
      imagePrompt,
      1,
      'landscape_16_9',
      'high'
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

  /**
   * Analyze image
   */
  private async analyzeImage(imageUrl: string, seed: EntitySeed, signal: AbortSignal): Promise<VisualAnalysis> {
    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Get analysis prompt
    const analysisPrompt = getPrompt('visualAnalysis', 'en')(
      seed.name,
      seed.looks,
      seed.wearing,
      seed.personality,
      seed.presence
    );

    // Call vision API
    const result = await mzooService.analyzeImage(
      this.mzooApiKey,
      base64Image,
      analysisPrompt,
      'image/jpeg',
      'gemini-2.5-flash'
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // Parse JSON response
    const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Enrich profile
   */
  private async enrichProfile(seed: EntitySeed, visualAnalysis: VisualAnalysis, signal: AbortSignal): Promise<DeepProfile> {
    const seedJson = JSON.stringify(seed, null, 2);
    const visionJson = JSON.stringify(visualAnalysis, null, 2);

    const enrichmentPrompt = getPrompt('deepProfileEnrichment', 'en')(seedJson, visionJson);

    const messages = [
      { role: 'system', content: enrichmentPrompt },
      { role: 'user', content: 'Generate the complete character profile based on the provided data.' }
    ];

    const result = await mzooService.generateText(
      this.mzooApiKey,
      messages,
      'gemini-2.5-flash'
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // Parse JSON response
    const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}

// Export factory function to create manager with API key
export function createSpawnManager(mzooApiKey: string): SpawnManager {
  return new SpawnManager(mzooApiKey);
}

// Export types
export type { SpawnProcess, EntitySeed, VisualAnalysis, DeepProfile };
