/**
 * Storage Service - File-based storage for development
 * 
 * Simple JSON file storage to replace localStorage,
 * making it easier to inspect and debug world and character data
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Use __dirname to get the actual file location, then navigate to packages/backend/temp-db
// This works regardless of where the Node process is started from
const STORAGE_DIR = path.resolve(__dirname, '../../../temp-db');
const WORLDS_FILE = path.join(STORAGE_DIR, 'worlds.json');
const CHARACTERS_FILE = path.join(STORAGE_DIR, 'characters.json');

export interface WorldsData {
  nodes: Record<string, any>;
  views: Record<string, any>;
  worldTrees: any[];
  pinnedIds: string[];
}

export interface CharactersData {
  characters: Record<string, any>;
  pinnedIds: string[];
}

class StorageService {
  /**
   * Ensures the temp-db directory exists
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.access(STORAGE_DIR);
    } catch {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Checks if worlds file exists
   */
  async hasWorldsFile(): Promise<boolean> {
    try {
      await fs.access(WORLDS_FILE);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load worlds data from file
   */
  async loadWorlds(): Promise<WorldsData | null> {
    try {
      await this.ensureStorageDir();
      
      const hasFile = await this.hasWorldsFile();
      if (!hasFile) {
        return null;
      }

      const data = await fs.readFile(WORLDS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('[Storage] Error loading worlds:', error);
      return null;
    }
  }

  /**
   * Save worlds data to file
   */
  async saveWorlds(data: WorldsData): Promise<boolean> {
    try {
      await this.ensureStorageDir();
      
      // Pretty print for easier inspection
      const json = JSON.stringify(data, null, 2);
      await fs.writeFile(WORLDS_FILE, json, 'utf-8');
      
      return true;
    } catch (error) {
      console.error('[Storage] Error saving worlds:', error);
      return false;
    }
  }

  /**
   * Clear all worlds data
   */
  async clearWorlds(): Promise<boolean> {
    try {
      const hasFile = await this.hasWorldsFile();
      if (hasFile) {
        await fs.unlink(WORLDS_FILE);
      }
      return true;
    } catch (error) {
      console.error('[Storage] Error clearing worlds:', error);
      return false;
    }
  }

  /**
   * Get file stats for debugging
   */
  async getWorldsFileInfo(): Promise<any> {
    try {
      const hasFile = await this.hasWorldsFile();
      if (!hasFile) {
        return { exists: false };
      }

      const stats = await fs.stat(WORLDS_FILE);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        path: WORLDS_FILE
      };
    } catch (error) {
      return { exists: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Checks if characters file exists
   */
  async hasCharactersFile(): Promise<boolean> {
    try {
      await fs.access(CHARACTERS_FILE);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load characters data from file
   */
  async loadCharacters(): Promise<CharactersData | null> {
    try {
      await this.ensureStorageDir();
      
      const hasFile = await this.hasCharactersFile();
      if (!hasFile) {
        return null;
      }

      const data = await fs.readFile(CHARACTERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('[Storage] Error loading characters:', error);
      return null;
    }
  }

  /**
   * Save characters data to file
   */
  async saveCharacters(data: CharactersData): Promise<boolean> {
    try {
      await this.ensureStorageDir();
      
      // Pretty print for easier inspection
      const json = JSON.stringify(data, null, 2);
      await fs.writeFile(CHARACTERS_FILE, json, 'utf-8');
      
      return true;
    } catch (error) {
      console.error('[Storage] Error saving characters:', error);
      return false;
    }
  }

  /**
   * Clear all characters data
   */
  async clearCharacters(): Promise<boolean> {
    try {
      const hasFile = await this.hasCharactersFile();
      if (hasFile) {
        await fs.unlink(CHARACTERS_FILE);
      }
      return true;
    } catch (error) {
      console.error('[Storage] Error clearing characters:', error);
      return false;
    }
  }

  /**
   * Get file stats for debugging
   */
  async getCharactersFileInfo(): Promise<any> {
    try {
      const hasFile = await this.hasCharactersFile();
      if (!hasFile) {
        return { exists: false };
      }

      const stats = await fs.stat(CHARACTERS_FILE);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        path: CHARACTERS_FILE
      };
    } catch (error) {
      return { exists: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
