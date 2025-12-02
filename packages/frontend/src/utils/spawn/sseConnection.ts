/**
 * SSE Connection Manager
 * Unified SSE setup and event handling for all spawn types
 */

import type { SpawnProcess } from '../../store/slices/spawnSlice';

export interface PipelineStep {
  index: number;
  id: string;
  name: string;
  duration: number;
}

export interface SSEHandlers {
  onProgress: (spawnId: string, data: any) => void;
  onCompleted: (spawnId: string, data: any) => void;
  onError: (spawnId: string, data: any) => void;
  onCancelled: (spawnId: string) => void;
}

/**
 * Setup SSE connection with unified event handlers
 */
export function setupSSEConnection(
  eventsUrl: string,
  spawnId: string,
  handlers: SSEHandlers
): EventSource {
  const eventSource = new EventSource(eventsUrl);

  // Progress events (first event includes pipeline step configuration)
  eventSource.addEventListener('progress', (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    // Log prompts to browser console when present
    if (data.data?.prompt) {
      console.log(`[PROMPT - ${data.stage}]`, data.data.prompt);
    }
    handlers.onProgress(spawnId, data);
  });

  // Completion events
  eventSource.addEventListener('completed', (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    // console.log(`[Spawn ${spawnId}] Completed:`, data);
    handlers.onCompleted(spawnId, data);
    eventSource.close();
  });

  // Error events
  eventSource.addEventListener('error', (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.error('Spawn error:', data);
    handlers.onError(spawnId, data);
    eventSource.close();
  });

  // Cancelled events
  eventSource.addEventListener('cancelled', () => {
    handlers.onCancelled(spawnId);
    eventSource.close();
  });

  // Generic error handler
  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) return;
  };

  return eventSource;
}

/**
 * Map stage name to step index
 * Returns the index of the step that corresponds to the stage
 */
export function getStepIndexFromStage(stage: string, steps: PipelineStep[]): number {
  // Handle completion stages (e.g., 'hierarchy_classification_complete')
  const stageId = stage.replace('_complete', '');
  
  // Find step index by matching stage ID
  const stepIndex = steps.findIndex(step => step.id === stageId);
  
  // Return -1 for 'started', actual index for stages
  if (stage === 'started') return -1;
  if (stepIndex >= 0) return stepIndex;
  
  // Fallback: try to find partial match
  for (let i = 0; i < steps.length; i++) {
    if (stageId.includes(steps[i].id) || steps[i].id.includes(stageId)) {
      return i;
    }
  }
  
  return -1;
}
