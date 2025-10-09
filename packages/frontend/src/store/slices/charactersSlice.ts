/**
 * Characters Storage Slice
 * Provides temporary localStorage-based CRUD operations for characters
 * Will be replaced with real database calls in the future
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Character interface - simple structure for metadata storage
export interface Character {
  id: string;
  name: string;
  details: Record<string, any>; // Deep profile JSON
  imagePath: string;
}

interface CharactersState {
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

export const useCharactersStore = create<CharactersState>()(
  persist(
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
    }),
    {
      name: 'morfeum-characters-storage',
      partialize: (state) => ({ 
        characters: state.characters,
        pinnedIds: state.pinnedIds 
      }),
    }
  )
);
