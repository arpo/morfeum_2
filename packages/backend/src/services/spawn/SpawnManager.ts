/**
 * ⚠️ DEPRECATED - DO NOT UPDATE
 * This code is being refactored into packages/backend/src/engine/
 * Any changes here will be lost during migration.
 * See: packages/backend/src/engine/REASSEMBLY_PLAN.md
 * 
 * Spawn Manager
 * Factory/Router for entity-specific pipeline managers
 */

import { eventEmitter } from '../eventEmitter';
import { BasePipelineManager } from './managers/BasePipelineManager';
import { CharacterSpawnManager } from './managers/CharacterSpawnManager';
import { LocationSpawnManager } from './managers/LocationSpawnManager';
import { SpawnProcess } from './types';

export class SpawnManager {
  private processes: Map<string, SpawnProcess> = new Map();
  private managers: Map<string, BasePipelineManager>;

  constructor(mzooApiKey: string) {
    // Initialize entity-specific pipeline managers
    this.managers = new Map<string, BasePipelineManager>();
    this.managers.set('character', new CharacterSpawnManager(mzooApiKey));
    this.managers.set('location', new LocationSpawnManager(mzooApiKey));
  }

  /**
   * Start a new spawn process
   */
  startSpawn(
    prompt: string, 
    entityType: 'character' | 'location' = 'character'
  ): string {
    const spawnId = `spawn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();

    const process: SpawnProcess = {
      id: spawnId,
      prompt,
      entityType,
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
   * Run the complete entity generation pipeline using appropriate manager
   */
  private async runPipeline(spawnId: string): Promise<void> {
    const process = this.processes.get(spawnId);
    if (!process) return;

    try {
      // Get the appropriate manager for this entity type
      const manager = this.managers.get(process.entityType);
      if (!manager) {
        throw new Error(`No manager found for entity type: ${process.entityType}`);
      }

      // Delegate to the entity-specific manager
      await manager.runPipeline(spawnId, process.prompt, process.abortController);

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
}
