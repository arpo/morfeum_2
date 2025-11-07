/**
 * World Storage Service
 * 
 * Handles persistence of worlds data to backend file storage
 * and automatic migration from localStorage
 */

export interface WorldsData {
  nodes: Record<string, any>;
  views: Record<string, any>;
  worldTrees: any[];
  pinnedIds: string[];
}

const LOCALSTORAGE_KEY = 'morfeum-locations-storage';

class WorldStorageService {
  /**
   * Check if backend has worlds file
   */
  async hasBackendWorlds(): Promise<boolean> {
    try {
      const response = await fetch('/api/worlds/check');
      const data = await response.json();
      return data.hasFile || false;
    } catch (error) {
      console.error('[WorldStorage] Error checking backend worlds:', error);
      return false;
    }
  }

  /**
   * Load worlds from backend
   */
  async loadWorlds(): Promise<WorldsData | null> {
    try {
      const response = await fetch('/api/worlds');
      if (!response.ok) {
        throw new Error(`Failed to load worlds: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('[WorldStorage] Error loading worlds:', error);
      return null;
    }
  }

  /**
   * Save worlds to backend
   */
  async saveWorlds(data: WorldsData): Promise<boolean> {
    try {
      const response = await fetch('/api/worlds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save worlds: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[WorldStorage] Error saving worlds:', error);
      return false;
    }
  }

  /**
   * Clear worlds from backend
   */
  async clearWorlds(): Promise<boolean> {
    try {
      const response = await fetch('/api/worlds', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear worlds: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[WorldStorage] Error clearing worlds:', error);
      return false;
    }
  }

  /**
   * Get worlds from localStorage (for migration)
   */
  getLocalStorageWorlds(): WorldsData | null {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Extract the state data (Zustand persist format includes state and version)
      const state = parsed.state || parsed;
      
      return {
        nodes: state.nodes || {},
        views: state.views || {},
        worldTrees: state.worldTrees || [],
        pinnedIds: state.pinnedIds || [],
      };
    } catch (error) {
      console.error('[WorldStorage] Error reading localStorage:', error);
      return null;
    }
  }

  /**
   * Clear localStorage (after successful migration)
   */
  clearLocalStorage(): void {
    try {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    } catch (error) {
      console.error('[WorldStorage] Error clearing localStorage:', error);
    }
  }

  /**
   * Perform automatic migration from localStorage to backend
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      // Check if backend already has data
      const hasBackend = await this.hasBackendWorlds();
      if (hasBackend) {
        return false;
      }
      
      // Check if localStorage has data
      const localData = this.getLocalStorageWorlds();
      if (!localData) {
        return false;
      }
      
      // Check if localStorage has actual content
      const hasContent = Object.keys(localData.nodes).length > 0 || 
                        localData.worldTrees.length > 0;
      
      if (!hasContent) {
        return false;
      }
      
      // Migrate to backend
      const saved = await this.saveWorlds(localData);
      
      if (saved) {
        // Optionally clear localStorage after successful migration
        // Keeping it for now as backup
        // this.clearLocalStorage();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[WorldStorage] Error during migration:', error);
      return false;
    }
  }

  /**
   * Initialize storage - perform migration if needed and load data
   */
  async initialize(): Promise<WorldsData | null> {
    try {
      // Try migration first
      await this.migrateFromLocalStorage();
      
      // Load from backend
      const worlds = await this.loadWorlds();
      
      return worlds;
    } catch (error) {
      console.error('[WorldStorage] Error during initialization:', error);
      return null;
    }
  }
}

// Export singleton instance
export const worldStorageService = new WorldStorageService();
