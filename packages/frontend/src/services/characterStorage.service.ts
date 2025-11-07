/**
 * Character Storage Service
 * 
 * Handles persistence of characters data to backend file storage
 * and automatic migration from localStorage
 */

export interface CharactersData {
  characters: Record<string, any>;
  pinnedIds: string[];
}

const LOCALSTORAGE_KEY = 'morfeum-characters-storage';

class CharacterStorageService {
  /**
   * Check if backend has characters file
   */
  async hasBackendCharacters(): Promise<boolean> {
    try {
      const response = await fetch('/api/characters/check');
      const data = await response.json();
      return data.hasFile || false;
    } catch (error) {
      console.error('[CharacterStorage] Error checking backend characters:', error);
      return false;
    }
  }

  /**
   * Load characters from backend
   */
  async loadCharacters(): Promise<CharactersData | null> {
    try {
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error(`Failed to load characters: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('[CharacterStorage] Error loading characters:', error);
      return null;
    }
  }

  /**
   * Save characters to backend
   */
  async saveCharacters(data: CharactersData): Promise<boolean> {
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save characters: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[CharacterStorage] Error saving characters:', error);
      return false;
    }
  }

  /**
   * Clear characters from backend
   */
  async clearCharacters(): Promise<boolean> {
    try {
      const response = await fetch('/api/characters', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear characters: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[CharacterStorage] Error clearing characters:', error);
      return false;
    }
  }

  /**
   * Get characters from localStorage (for migration)
   */
  getLocalStorageCharacters(): CharactersData | null {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Extract the state data (Zustand persist format includes state and version)
      const state = parsed.state || parsed;
      
      return {
        characters: state.characters || {},
        pinnedIds: state.pinnedIds || [],
      };
    } catch (error) {
      console.error('[CharacterStorage] Error reading localStorage:', error);
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
      console.error('[CharacterStorage] Error clearing localStorage:', error);
    }
  }

  /**
   * Perform automatic migration from localStorage to backend
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      // Check if backend already has data
      const hasBackend = await this.hasBackendCharacters();
      if (hasBackend) {
        return false;
      }
      
      // Check if localStorage has data
      const localData = this.getLocalStorageCharacters();
      if (!localData) {
        return false;
      }
      
      // Check if localStorage has actual content
      const hasContent = Object.keys(localData.characters).length > 0;
      
      if (!hasContent) {
        return false;
      }
      
      // Migrate to backend
      const saved = await this.saveCharacters(localData);
      
      if (saved) {
        // Optionally clear localStorage after successful migration
        // Keeping it for now as backup
        // this.clearLocalStorage();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[CharacterStorage] Error during migration:', error);
      return false;
    }
  }

  /**
   * Initialize storage - perform migration if needed and load data
   */
  async initialize(): Promise<CharactersData | null> {
    try {
      // Try migration first
      await this.migrateFromLocalStorage();
      
      // Load from backend
      const characters = await this.loadCharacters();
      
      return characters;
    } catch (error) {
      console.error('[CharacterStorage] Error during initialization:', error);
      return null;
    }
  }
}

// Export singleton instance
export const characterStorageService = new CharacterStorageService();
