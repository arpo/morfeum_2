/**
 * SSE Connection Manager
 * Unified SSE setup and event handling for all spawn types
 */

import type { SpawnProcess } from '../../store/slices/spawnSlice';

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

  // Progress events
  eventSource.addEventListener('progress', (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.log(`[Spawn ${spawnId}] Progress:`, data.message, data);
    handlers.onProgress(spawnId, data);
  });

  // Completion events
  eventSource.addEventListener('completed', (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.log(`[Spawn ${spawnId}] Completed:`, data);
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
 * Progress calculation for different pipeline stages
 */
export function calculateProgress(stage: string): number {
  const progressMap: Record<string, number> = {
    // Common
    'started': 5,
    'completed': 100,
    
    // World Tree Pipeline
    'hierarchy_classification': 10,
    'hierarchy_complete': 25,
    
    // Character Pipeline  
    'seed_generation': 20,
    'seed_complete': 25,
    'profile_enrichment': 75,
    'profile_complete': 95,
    
    // Navigation Pipeline
    'prompt_generation': 25,
    'prompt_complete': 30,
    'node_building': 90,
    
    // Shared stages
    'image_generation': 30,
    'image_complete': 50,
    'visual_analysis': 60,
    'analysis_complete': 70,
    'dna_generation': 80,
    'dna_complete': 95,
  };

  return progressMap[stage] || 0;
}
