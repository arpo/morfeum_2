/**
 * Entity Manager Slice
 * Manages entity sessions (characters and locations) - CRUD operations only
 * UI state is handled by entityUISlice
 */

import type { StateCreator } from 'zustand';
import { EntityUISlice } from './entityUISlice';
import { 
  buildCharacterSystemPrompt, 
  buildMinimalSystemPrompt
} from '../../utils/entity/buildCharacterSystemPrompt';
import type {
  ChatMessage,
  DeepProfile,
  EntityData,
  EntityManagerSlice,
  CharacterDetails,
  EnvironmentContext
} from './entityManagerTypes';

// Re-export types for consumers
export type { ChatMessage, DeepProfile, EntityData, EntityManagerSlice };

// Combined type for store that uses both slices
export type EntitySlices = EntityManagerSlice & EntityUISlice;

export const createEntityManagerSlice: StateCreator<EntitySlices, [], [], EntityManagerSlice> = (set, get) => ({
  entities: new Map(),
  activeEntity: null,

  createEntity: (
    spawnId: string, 
    seed: any, 
    entityType?: 'character' | 'location',
    characterDetails?: CharacterDetails,
    environment?: EnvironmentContext
  ) => {
    // Build rich system prompt if full character details provided
    let systemPromptContent: string;
    
    if (characterDetails) {
      systemPromptContent = buildCharacterSystemPrompt(characterDetails, environment);
    } else {
      // Fallback to minimal prompt for basic seed data
      systemPromptContent = buildMinimalSystemPrompt(seed.name, seed.personality);
    }
    
    const systemMessage: ChatMessage = {
      id: 'system-001',
      role: 'system',
      content: systemPromptContent,
      timestamp: new Date().toISOString()
    };

    const entityData: EntityData = {
      spawnId,
      entityName: seed.name,
      entityType: entityType || 'character',
      entityPersonality: seed.personality,
      systemPrompt: systemMessage.content,
      messages: [systemMessage]
    };

    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.set(spawnId, entityData);
      return {
        entities: newEntities,
        activeEntity: spawnId
      };
    });
  },

  updateEntityImage: (spawnId: string, imageUrl: string) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

      if (entity.entityImage === imageUrl) {
        return state;
      }

      const newEntities = new Map(state.entities);
      newEntities.set(spawnId, {
        ...entity,
        entityImage: imageUrl
      });
      return { entities: newEntities };
    });
  },

  updateEntityImagePrompt: (spawnId: string, imagePrompt: string) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

      const newEntities = new Map(state.entities);
      newEntities.set(spawnId, {
        ...entity,
        imagePrompt
      });
      return { entities: newEntities };
    });
  },

  updateEntitySystemPrompt: (spawnId: string, systemPrompt: string) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

      const newEntities = new Map(state.entities);
      const updatedMessages = [...entity.messages];
      
      const systemMessageIndex = updatedMessages.findIndex(m => m.role === 'system');
      if (systemMessageIndex !== -1) {
        updatedMessages[systemMessageIndex] = {
          ...updatedMessages[systemMessageIndex],
          content: systemPrompt
        };
      }

      newEntities.set(spawnId, {
        ...entity,
        systemPrompt,
        messages: updatedMessages
      });
      return { entities: newEntities };
    });
  },

  updateEntityProfile: (spawnId: string, deepProfile: DeepProfile) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

      const newEntities = new Map(state.entities);
      newEntities.set(spawnId, {
        ...entity,
        deepProfile
      });
      return { entities: newEntities };
    });
  },

  setActiveEntity: (spawnId: string) => {
    set({ activeEntity: spawnId });
  },

  closeEntity: (spawnId: string) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.delete(spawnId);
      
      const newActiveEntity = state.activeEntity === spawnId ? null : state.activeEntity;
      
      return {
        entities: newEntities,
        activeEntity: newActiveEntity
      };
    });
  },

  sendMessage: async (spawnId: string, content: string) => {
    const state = get();
    const entity = state.entities.get(spawnId);
    
    if (!entity) {
      console.error('[EntityManager] Entity not found:', spawnId);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    set((state) => {
      const newEntities = new Map(state.entities);
      const entity = newEntities.get(spawnId);
      if (!entity) return state;

      newEntities.set(spawnId, {
        ...entity,
        messages: [...entity.messages, userMessage],
        loading: true,
        error: null
      });
      return { entities: newEntities };
    });

    try {
      const updatedEntity = get().entities.get(spawnId);
      if (!updatedEntity) return;

      const apiMessages = updatedEntity.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/mzoo/gemini/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: 'gemini-2.5-flash-lite'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.data.text,
        timestamp: new Date().toISOString()
      };

      set((state) => {
        const newEntities = new Map(state.entities);
        const entity = newEntities.get(spawnId);
        if (!entity) return state;

        newEntities.set(spawnId, {
          ...entity,
          messages: [...entity.messages, assistantMessage],
          loading: false
        });
        return { entities: newEntities };
      });
    } catch (error) {
      console.error('[EntityManager] Error sending message:', error);
      
      set((state) => {
        const newEntities = new Map(state.entities);
        const entity = newEntities.get(spawnId);
        if (!entity) return state;

        newEntities.set(spawnId, {
          ...entity,
          loading: false,
          error: 'Failed to send message. Please try again.'
        });
        return { entities: newEntities };
      });
    }
  },

  setLoading: (spawnId: string, loading: boolean) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

      const newEntities = new Map(state.entities);
      newEntities.set(spawnId, {
        ...entity,
        loading
      });
      return { entities: newEntities };
    });
  },

  setError: (spawnId: string, error: string | null) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

      const newEntities = new Map(state.entities);
      newEntities.set(spawnId, {
        ...entity,
        error
      });
      return { entities: newEntities };
    });
  }
});
