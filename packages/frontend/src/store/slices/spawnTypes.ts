/**
 * Spawn Slice Types
 * Type definitions for spawn process management
 */

import type { PipelineStep } from '../../utils/spawn/sseConnection';

export interface SpawnStage {
  name: string;
  message: string;
  timestamp: number;
}

export interface SpawnProcess {
  id: string;
  prompt: string;
  entityType: 'character' | 'location' | 'niche';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStage: string;
  logs: string[];
  stages: SpawnStage[];
  result?: any;
  eventsUrl?: string;
  imageUrl?: string;
  error?: string;
  // Progress bar fields
  pipelineType?: string;
  steps?: PipelineStep[];
  currentStepIndex?: number;
}

export interface SpawnSlice {
  activeSpawns: SpawnProcess[];
  
  startSpawn: (prompt: string, entityType?: 'character' | 'location' | 'niche', options?: any) => Promise<string>;
  registerExternalSpawn: (
    id: string, 
    eventsUrl: string, 
    prompt: string, 
    entityType: 'character' | 'location' | 'niche',
    onComplete?: (data: any) => void,
    onError?: (error: any) => void
  ) => void;
  cancelSpawn: (spawnId: string) => Promise<void>;
  updateSpawnProgress: (spawnId: string, update: Partial<SpawnProcess>) => void;
  addSpawnLog: (spawnId: string, message: string) => void;
  completeSpawn: (spawnId: string, result: any) => void;
  failSpawn: (spawnId: string, error: string) => void;
  removeSpawn: (spawnId: string) => void;
}

export interface SpawnCallbacks {
  onComplete?: (data: any) => void;
  onError?: (err: any) => void;
}
