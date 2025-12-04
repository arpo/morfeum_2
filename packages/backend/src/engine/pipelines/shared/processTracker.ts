/**
 * Process Tracker
 * Centralized tracking for active pipeline processes
 * Replaces old SpawnManager's tracking functionality
 */

export interface ActiveProcess {
  id: string;
  prompt: string;
  entityType: 'character' | 'location';
  status: 'running' | 'completed' | 'cancelled' | 'error';
  createdAt: number;
  abortController: AbortController;
  error?: string;
}

/**
 * Singleton class for tracking active pipeline processes
 */
class ProcessTracker {
  private processes: Map<string, ActiveProcess> = new Map();

  /**
   * Start tracking a new process
   */
  startProcess(
    id: string,
    prompt: string,
    entityType: 'character' | 'location',
    abortController: AbortController
  ): void {
    this.processes.set(id, {
      id,
      prompt,
      entityType,
      status: 'running',
      createdAt: Date.now(),
      abortController,
    });
  }

  /**
   * Update process status when completed
   */
  completeProcess(id: string, status: 'completed' | 'cancelled' | 'error', error?: string): void {
    const process = this.processes.get(id);
    if (process) {
      process.status = status;
      if (error) {
        process.error = error;
      }
    }
  }

  /**
   * Cancel a process by ID
   */
  cancelProcess(id: string): boolean {
    const process = this.processes.get(id);
    if (!process) {
      return false;
    }

    if (process.status === 'completed' || process.status === 'cancelled' || process.status === 'error') {
      return false;
    }

    process.abortController.abort();
    process.status = 'cancelled';
    return true;
  }

  /**
   * Get abort controller for a process
   */
  getAbortController(id: string): AbortController | undefined {
    return this.processes.get(id)?.abortController;
  }

  /**
   * Remove a process from tracking (cleanup after completion)
   */
  removeProcess(id: string): void {
    this.processes.delete(id);
  }

  /**
   * Get all active (running) processes
   */
  getActiveProcesses(): ActiveProcess[] {
    return Array.from(this.processes.values()).filter(
      (p) => p.status === 'running'
    );
  }

  /**
   * Get process by ID
   */
  getProcess(id: string): ActiveProcess | undefined {
    return this.processes.get(id);
  }

  /**
   * Check if a process exists and is active
   */
  isActive(id: string): boolean {
    const process = this.processes.get(id);
    return process?.status === 'running';
  }
}

// Export singleton instance
export const processTracker = new ProcessTracker();
