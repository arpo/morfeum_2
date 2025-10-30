/**
 * Entity Manager Slice
 * Manages multiple entity sessions (characters and locations)
 */

import type { StateCreator } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DeepProfile {
  name: string;
  looks: string;
  wearing: string;
  face: string;
  body: string;
  hair: string;
  specificDetails: string;
  style: string;
  personality: string;
  voice: string;
  speechStyle: string;
  gender: string;
  nationality: string;
  fictional: string;
  copyright: string;
  tags: string;
}

export interface EntityData {
  spawnId: string;
  entityName: string;
  entityType?: 'character' | 'location';
  entityPersonality?: string;
  entityImage?: string;
  imagePrompt?: string;
  systemPrompt: string;
  messages: ChatMessage[];
  loading?: boolean;
  error?: string | null;
  deepProfile?: DeepProfile;
}

export interface EntityManagerSlice {
  entities: Map<string, EntityData>;
  activeEntity: string | null;
  entityPanelOpen: Map<string, boolean>;

  createEntity: (spawnId: string, seed: any, entityType?: 'character' | 'location') => void;
  updateEntityImage: (spawnId: string, imageUrl: string) => void;
  updateEntityImagePrompt: (spawnId: string, imagePrompt: string) => void;
  updateEntitySystemPrompt: (spawnId: string, systemPrompt: string) => void;
  updateEntityProfile: (spawnId: string, deepProfile: DeepProfile) => void;
  setActiveEntity: (spawnId: string) => void;
  closeEntity: (spawnId: string) => void;
  sendMessage: (spawnId: string, content: string) => Promise<void>;
  setLoading: (spawnId: string, loading: boolean) => void;
  setError: (spawnId: string, error: string | null) => void;
  openEntityPanel: (entityId: string) => void;
  closeEntityPanel: (entityId: string) => void;
  isEntityPanelOpen: (entityId: string) => boolean;
}

export const createEntityManagerSlice: StateCreator<EntityManagerSlice> = (set, get) => ({
  entities: new Map(),
  activeEntity: null,
  entityPanelOpen: new Map(),

  createEntity: (spawnId: string, seed: any, entityType?: 'character' | 'location') => {
    const systemMessage: ChatMessage = {
      id: 'system-001',
      role: 'system',
      content: `You are ${seed.name}. ${seed.personality}`,
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
        activeEntity: spawnId // Automatically switch to new entity
      };
    });
  },

  updateEntityImage: (spawnId: string, imageUrl: string) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

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
      
      // Update the system message if it exists
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
      
      // If we're closing the active entity, clear activeEntity
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

    // Add user message
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
      // Prepare messages for API (include system prompt and full history)
      const updatedEntity = get().entities.get(spawnId);
      if (!updatedEntity) return;

      const apiMessages = updatedEntity.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call backend API
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

      // Add assistant message
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
  },

  openEntityPanel: (entityId: string) => {
    set((state) => {
      const newEntityPanelOpen = new Map(state.entityPanelOpen);
      newEntityPanelOpen.set(entityId, true);
      return { entityPanelOpen: newEntityPanelOpen };
    });
  },

  closeEntityPanel: (entityId: string) => {
    set((state) => {
      const newEntityPanelOpen = new Map(state.entityPanelOpen);
      newEntityPanelOpen.set(entityId, false);
      return { entityPanelOpen: newEntityPanelOpen };
    });
  },

  isEntityPanelOpen: (entityId: string) => {
    return get().entityPanelOpen.get(entityId) || false;
  }
});
