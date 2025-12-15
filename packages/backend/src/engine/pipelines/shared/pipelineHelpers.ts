/**
 * Pipeline Helpers
 * Unified utilities for SSE events, timing, and logging across all pipelines
 */

import { sseService } from '../../../services/SSEService';
import { getStepsForPipeline, type PipelineType, type PipelineStep } from './pipelineConfig';

export interface PipelineTimings {
  [stage: string]: number;
}

export interface PipelineStage {
  name: string;
  message: string;
  data?: any;
}

/**
 * Pipeline helper class for managing SSE events, timing, and logging
 */
export class PipelineHelper {
  private spawnId: string;
  private pipelineName: string;
  private pipelineType: PipelineType;
  private steps: readonly PipelineStep[];
  private startTime: number;
  private timings: PipelineTimings = {};
  private currentStageStart: number = 0;

  constructor(spawnId: string, pipelineName: string, pipelineType: PipelineType) {
    this.spawnId = spawnId;
    this.pipelineName = pipelineName;
    this.pipelineType = pipelineType;
    this.steps = getStepsForPipeline(pipelineType);
    this.startTime = Date.now();
  }

  /**
   * Send pipeline started event
   * This creates an initial progress event that allows the UI to show the progress bar
   * at 0% before the first step begins animating
   * Includes pipeline steps so frontend knows total step count for progress calculation
   */
  started(message: string = 'Initializing...') {
    console.log(`[${this.pipelineName}] Starting pipeline for ${this.spawnId} (${this.steps.length} steps)`);
    this.currentStageStart = Date.now();
    
    // Send started event with step configuration so frontend can calculate progress
    sseService.sendEvent(this.spawnId, 'progress', {
      stage: 'started',
      message,
      pipelineType: this.pipelineType,
      steps: this.steps.map((step, index) => ({
        index,
        id: step.id,
        name: step.name,
        duration: step.duration
      }))
    });
  }

  /**
   * Update pipeline configuration (steps) mid-stream
   * Used when interior is detected after initial exterior pipeline config was sent
   * Frontend will update its step count based on this event
   */
  updatePipelineConfig(newPipelineType: PipelineType, message: string = 'Updating pipeline...') {
    this.pipelineType = newPipelineType;
    this.steps = getStepsForPipeline(newPipelineType);
    
    console.log(`[${this.pipelineName}] ${this.spawnId} Updating pipeline type to: ${newPipelineType} (${this.steps.length} steps)`);
    
    // Send config update event - frontend will update its step count
    sseService.sendEvent(this.spawnId, 'progress', {
      stage: 'config_update',
      message,
      pipelineType: newPipelineType,
      steps: this.steps.map((step, index) => ({
        index,
        id: step.id,
        name: step.name,
        duration: step.duration
      }))
    });
  }

  /**
   * Start timing a stage
   */
  startStage(stageName: string, message: string, data?: any) {
    this.currentStageStart = Date.now();
    console.log(`[${this.pipelineName}] ${this.spawnId} ${message}`);
    sseService.sendEvent(this.spawnId, 'progress', {
      stage: stageName,
      message,
      data
    });
  }

  /**
   * Complete a stage and record timing
   */
  completeStage(stageName: string, message: string, data?: any) {
    const duration = Date.now() - this.currentStageStart;
    this.timings[stageName] = duration;
    
    console.log(`[${this.pipelineName}] ${this.spawnId} ${message} (${(duration / 1000).toFixed(2)}s)`);
    sseService.sendEvent(this.spawnId, 'progress', {
      stage: `${stageName}_complete`,
      message,
      data
    });
  }

  /**
   * Send pipeline completed event
   */
  completed(message: string, result: any) {
    const totalTime = Date.now() - this.startTime;
    
    // Log summary
    console.log(`\n[${this.pipelineName}] ${this.spawnId} completed in ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Stage Timings:`);
    Object.entries(this.timings).forEach(([stage, time]) => {
      const label = stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`    - ${label}: ${(time / 1000).toFixed(2)}s`);
    });
    console.log(`  Total: ${(totalTime / 1000).toFixed(2)}s\n`);

    // Send SSE event
    sseService.sendEvent(this.spawnId, 'completed', {
      message,
      ...result,
      timings: this.timings
    });

    // Close connection
    setTimeout(() => sseService.closeConnection(this.spawnId), 1000);
  }

  /**
   * Send pipeline error event
   */
  error(error: Error | string) {
    const message = error instanceof Error ? error.message : error;
    console.error(`[${this.pipelineName}] Pipeline failed:`, error);
    
    sseService.sendEvent(this.spawnId, 'error', {
      message: 'Pipeline failed',
      error: message
    });
    
    sseService.closeConnection(this.spawnId);
  }

  /**
   * Send pipeline cancelled event
   */
  cancelled() {
    console.log(`[${this.pipelineName}] ${this.spawnId} cancelled`);
    sseService.sendEvent(this.spawnId, 'cancelled', {
      message: 'Pipeline cancelled'
    });
    sseService.closeConnection(this.spawnId);
  }

  /**
   * Get current timings
   */
  getTimings(): PipelineTimings {
    return { ...this.timings };
  }

  /**
   * Get total elapsed time
   */
  getTotalTime(): number {
    return Date.now() - this.startTime;
  }
}
