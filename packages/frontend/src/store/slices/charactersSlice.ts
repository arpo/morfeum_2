/**
 * Characters Storage Slice
 * Uses backend file storage for persistence
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { characterStorageService, CharactersData } from '@/services/characterStorage.service';

// Character interface - simple structure for metadata storage
export interface Character {
  id: string;
  name: string;
  details: Record<string, any>; // Deep profile JSON
  imagePath: string;
}

// Storage actions
export interface StorageActions {
  saveToBackend: () => Promise<boolean>;
  loadFromBackend: () => Promise<boolean>;
  initializeFromBackend: () => Promise<boolean>;
  clearBackend: () => Promise<boolean>;
}

interface CharactersState extends StorageActions {
  characters: Record<string, Character>;
  pinnedIds: string[];
  
  // CRUD operations
  createCharacter: (character: Omit<Character, 'id'> & { id?: string }) => string;
  getCharacter: (id: string) => Character | undefined;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  
  // Query operations
  getAllCharacters: () => Character[];
  
  // Pin operations
  togglePinned: (id: string) => void;
  isPinned: (id: string) => boolean;
  getPinnedCharacters: () => Character[];
  
  // Bulk operations
  clearAllCharacters: () => void;
  importCharacters: (characters: Character[]) => void;
}

// Create the store WITHOUT persist middleware
export const useCharactersStore = create<CharactersState>()(
  (set, get) => ({
      characters: {},
      pinnedIds: [],
      
      createCharacter: (character) => {
        const id = character.id || uuidv4();
        const newCharacter: Character = {
          ...character,
          id,
        };
        
        set((state) => ({
          characters: {
            ...state.characters,
            [id]: newCharacter,
          },
        }));
        
        return id;
      },
      
      getCharacter: (id) => {
        return get().characters[id];
      },
      
      updateCharacter: (id, updates) => {
        set((state) => {
          const existing = state.characters[id];
          if (!existing) return state;
          
          return {
            characters: {
              ...state.characters,
              [id]: {
                ...existing,
                ...updates,
              },
            },
          };
        });
      },
      
      deleteCharacter: (id) => {
        set((state) => {
          const { [id]: deleted, ...rest } = state.characters;
          return { characters: rest };
        });
      },
      
      getAllCharacters: () => {
        return Object.values(get().characters);
      },
      
      togglePinned: (id) => {
        const character = get().characters[id];
        if (!character) return;
        
        set((state) => {
          const pinnedIds = [...state.pinnedIds];
          const index = pinnedIds.indexOf(id);
          
          if (index > -1) {
            // Already pinned, unpin it
            pinnedIds.splice(index, 1);
          } else {
            // Not pinned, pin it
            pinnedIds.push(id);
          }
          
          return { pinnedIds };
        });
      },
      
      isPinned: (id) => {
        return get().pinnedIds.includes(id);
      },
      
      getPinnedCharacters: () => {
        const pinnedIds = get().pinnedIds;
        return pinnedIds
          .map(id => get().characters[id])
          .filter(Boolean) as Character[];
      },
      
      clearAllCharacters: () => {
        set({ characters: {}, pinnedIds: [] });
      },
      
      importCharacters: (characters) => {
        const charactersMap = characters.reduce((acc, character) => {
          acc[character.id] = character;
          return acc;
        }, {} as Record<string, Character>);
        
        set({ characters: charactersMap });
      },
      
      // Storage actions
      saveToBackend: async () => {
        const state = useCharactersStore.getState();
        const data: CharactersData = {
          characters: state.characters,
          pinnedIds: state.pinnedIds,
        };
        return await characterStorageService.saveCharacters(data);
      },
      
      loadFromBackend: async () => {
        const data = await characterStorageService.loadCharacters();
        if (data) {
          useCharactersStore.setState({
            characters: data.characters,
            pinnedIds: data.pinnedIds,
          });
          console.log('[CharactersStore] Loaded characters from backend');
          return true;
        }
        return false;
      },
      
      initializeFromBackend: async () => {
        // This handles migration automatically
        const data = await characterStorageService.initialize();
        if (data) {
          useCharactersStore.setState({
            characters: data.characters,
            pinnedIds: data.pinnedIds,
          });
          console.log('[CharactersStore] Initialized with backend data');
          return true;
        }
        console.log('[CharactersStore] No backend data, starting fresh');
        return false;
      },
      
      clearBackend: async () => {
        const cleared = await characterStorageService.clearCharacters();
        if (cleared) {
          // Also clear local state
          useCharactersStore.setState({
            characters: {},
            pinnedIds: [],
          });
          console.log('[CharactersStore] Cleared backend and local state');
        }
        return cleared;
      },
    })
);
