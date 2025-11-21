import type { StateCreator } from 'zustand';
import { worldStorageService } from '../../services/worldStorage.service';
import { useLocationsStore } from './locations';
// Avoid circular dependency with index.ts by not importing CombinedStore if possible or using any
// import type { CombinedStore } from '../index'; 

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
  error?: string;
}

export interface SpawnSlice {
  activeSpawns: SpawnProcess[];
  
  startSpawn: (prompt: string, entityType?: 'character' | 'location' | 'niche', options?: any) => Promise<string>;
  cancelSpawn: (spawnId: string) => Promise<void>;
  updateSpawnProgress: (spawnId: string, update: Partial<SpawnProcess>) => void;
  addSpawnLog: (spawnId: string, message: string) => void;
  completeSpawn: (spawnId: string, result: any) => void;
  failSpawn: (spawnId: string, error: string) => void;
  removeSpawn: (spawnId: string) => void;
}

export const createSpawnSlice: StateCreator<any, [], [], SpawnSlice> = (set, get) => ({
  activeSpawns: [],

  startSpawn: async (prompt: string, entityType = 'character', options = true) => {
    // Handle niche or unsupported types gracefully or map them
    if (entityType === 'niche') {
        console.warn('Niche spawning not fully implemented in new engine yet. Falling back or ignoring.');
        // TODO: Implement niche spawning via API
        return 'niche-stub-id';
    }

    const endpoint = entityType === 'location' 
      ? '/api/spawn/location/start' 
      : '/api/spawn/engine/start';
      
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, entityType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start spawn: ${response.statusText}`);
      }

      const result = await response.json();
      const { spawnId, eventsUrl } = result.data;

      const newProcess: SpawnProcess = {
        id: spawnId,
        prompt,
        entityType: entityType as 'character' | 'location',
        status: 'processing',
        progress: 0,
        currentStage: 'Initializing...',
        logs: ['Spawn initiated'],
        stages: [],
        eventsUrl
      };

      set((state: any) => ({
        activeSpawns: [...state.activeSpawns, newProcess]
      }));

      // Establish SSE connection if eventsUrl is provided
      if (eventsUrl) {
        const eventSource = new EventSource(eventsUrl);
        
        // eventSource.onmessage = (event) => { // Ping/Keep-alive };

        eventSource.addEventListener('progress', (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          console.log(`[Spawn ${spawnId}] Progress:`, data.message, data);
          get().updateSpawnProgress(spawnId, {
            currentStage: data.message,
            progress: calculateProgress(data.stage)
          });
          get().addSpawnLog(spawnId, data.message);
        });

        eventSource.addEventListener('completed', (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          console.log(`[Spawn ${spawnId}] Completed:`, data);
          get().completeSpawn(spawnId, data.worldTree);
          eventSource.close();
        });

        eventSource.addEventListener('error', (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          console.error('Spawn error:', data);
          get().failSpawn(spawnId, data.message || 'Unknown error');
          eventSource.close();
        });

        eventSource.addEventListener('cancelled', () => {
          get().updateSpawnProgress(spawnId, { status: 'cancelled' });
          eventSource.close();
        });
        
        eventSource.onerror = (err) => {
           if (eventSource.readyState === EventSource.CLOSED) return;
           // console.error('EventSource error:', err);
        };
      }

      return spawnId;
    } catch (error: any) {
      console.error('Start spawn failed:', error);
      throw error;
    }
  },

  cancelSpawn: async (spawnId: string) => {
    try {
      await fetch(`/api/spawn/${spawnId}`, { method: 'DELETE' });
      set((state: any) => ({
        activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
          p.id === spawnId ? { ...p, status: 'cancelled' } : p
        )
      }));
    } catch (error) {
      console.error('Cancel spawn failed:', error);
    }
  },

  updateSpawnProgress: (spawnId, update) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, ...update } : p
      )
    }));
  },

  addSpawnLog: (spawnId, message) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, logs: [...p.logs, message] } : p
      )
    }));
  },

  completeSpawn: (spawnId, worldTree) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, status: 'completed', progress: 100, result: worldTree, currentStage: 'Completed' } : p
      )
    }));

    // Logic to Pin, Unfold, and Select
    if (worldTree) {
       // 1. Pin the world and update Locations Store
       useLocationsStore.getState().setCompleteWorldTree(worldTree);
       
       // 2. Calculate deep ID and ancestors for expansion
       const deepId = findDeepestNodeId(worldTree);
       const ancestors = getAncestors(worldTree, deepId);
       
       // 3. Update Expansion (localStorage hack for TreeView)
       const persistenceKey = 'entity-explorer-locations';
       try {
           const existingStr = localStorage.getItem(persistenceKey);
           let existing: string[] = [];
           if (existingStr) {
             try { existing = JSON.parse(existingStr); } catch(e) {}
           }
           
           const newExpanded = [...new Set([...existing, ...ancestors])];
           localStorage.setItem(persistenceKey, JSON.stringify(newExpanded));
           
       } catch (e) {
         console.error('Failed to update tree expansion', e);
       }
       
       // 4. Select Node (Create Session if needed + Set Active)
       if (deepId) {
          const store = get(); // This is the main store (EntityManager)
          
          // Create entity session so it appears in tabs and main view
          const locationsState = useLocationsStore.getState();
          const node = locationsState.nodes[deepId] || findNodeInObject(worldTree, deepId);
          
          const seed = { 
            name: node?.name || 'New Location', 
            atmosphere: 'Generated' 
          }; 
          
          store.createEntity(deepId, seed, 'location'); 
          
          if (node?.imagePath) {
             store.updateEntityImage(deepId, node.imagePath);
          }
          
          store.setActiveEntity(deepId);
          localStorage.setItem('lastActiveEntityId', deepId);
       }
    }
  },

  failSpawn: (spawnId, error) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, status: 'failed', error } : p
      )
    }));
  },

  removeSpawn: (spawnId) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.filter((p: SpawnProcess) => p.id !== spawnId)
    }));
  }
});

function calculateProgress(stage: string): number {
  switch (stage) {
    case 'started': return 5;
    case 'hierarchy_classification': return 10;
    case 'hierarchy_complete': return 25;
    case 'image_generation': return 30;
    case 'image_complete': return 50;
    case 'visual_analysis': return 60;
    case 'analysis_complete': return 70;
    case 'dna_generation': return 80;
    case 'dna_complete': return 95;
    case 'completed': return 100;
    default: return 0;
  }
}

function findDeepestNodeId(worldTree: any): string | null {
    if (!worldTree) return null;
    
    if (worldTree.regions && worldTree.regions.length > 0) {
        const region = worldTree.regions[0];
        if (region.locations && region.locations.length > 0) {
             const location = region.locations[0];
             if (location.niches && location.niches.length > 0) {
                 // Assuming niche has id
                 return location.niches[0].id || location.niches[0].slug;
             }
             return location.id || location.slug;
        }
        return region.id || region.slug;
    }
    return worldTree.id || worldTree.slug;
}

function getAncestors(tree: any, targetId: string | null): string[] {
  if (!targetId || !tree) return [];
  
  const ancestors: string[] = [];
  
  // Helper recursive search
  const search = (node: any, path: string[]): boolean => {
    if (node.id === targetId || node.slug === targetId) {
      path.forEach(p => ancestors.push(p));
      return true;
    }
    
    // Check children arrays (regions, locations, niches)
    const children = [
      ...(node.regions || []),
      ...(node.locations || []),
      ...(node.niches || [])
    ];
    
    for (const child of children) {
      if (search(child, [...path, node.id || node.slug])) {
        return true; // Found in this branch
      }
    }
    
    return false;
  };
  
  search(tree, []);
  return ancestors;
}

function findNodeInObject(tree: any, targetId: string): any {
  if (tree.id === targetId || tree.slug === targetId) return tree;
  const children = [
      ...(tree.regions || []),
      ...(tree.locations || []),
      ...(tree.niches || [])
    ];
  for (const child of children) {
    const found = findNodeInObject(child, targetId);
    if (found) return found;
  }
  return null;
}
