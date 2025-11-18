/**
 * Shared Pipeline Logger
 * Provides consistent timing and logging for all pipelines
 */

interface StageTiming {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * Pipeline timer for tracking and logging pipeline execution
 */
export class PipelineTimer {
  private stages: Map<string, StageTiming> = new Map();
  private pipelineStartTime: number;
  private pipelineName: string;

  constructor(pipelineName: string) {
    this.pipelineName = pipelineName;
    this.pipelineStartTime = Date.now();
  }

  /**
   * Start timing a stage
   */
  start(stageName: string): void {
    this.stages.set(stageName, {
      name: stageName,
      startTime: Date.now()
    });
  }

  /**
   * End timing a stage
   */
  end(stageName: string): void {
    const stage = this.stages.get(stageName);
    if (stage) {
      stage.endTime = Date.now();
      stage.duration = stage.endTime - stage.startTime;
    }
  }

  /**
   * Log summary of all stages
   */
  logSummary(entityType?: string): void {
    const totalTime = Date.now() - this.pipelineStartTime;
    
    console.log(`\n[${this.pipelineName}] Pipeline completed in ${(totalTime / 1000).toFixed(2)}s`);
    
    if (entityType) {
      console.log(`  Entity Type: ${entityType}`);
    }
    
    if (this.stages.size > 0) {
      console.log(`  Stage Timings:`);
      this.stages.forEach(stage => {
        if (stage.duration !== undefined) {
          console.log(`    - ${stage.name.padEnd(25)} ${(stage.duration / 1000).toFixed(2)}s`);
        }
      });
    }
    
    console.log(`  Total: ${(totalTime / 1000).toFixed(2)}s\n`);
  }

  /**
   * Get total elapsed time
   */
  getTotalTime(): number {
    return Date.now() - this.pipelineStartTime;
  }
}
