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
  
  // CRUD operations
  createCharacter: (character: Omit<Character, 'id'> & { id?: string }) => string;
  getCharacter: (id: string) => Character | undefined;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  
  // Query operations
  getAllCharacters: () => Character[];
  
  // Bulk operations
  clearAllCharacters: () => void;
  importCharacters: (characters: Character[]) => void;
}

export const useCharactersStore = create<CharactersState>()(
  persist(
    (set, get) => ({
      characters: {},
      
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
      
      clearAllCharacters: () => {
        set({ characters: {} });
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
      partialize: (state) => ({ characters: state.characters }),
    }
  )
);
