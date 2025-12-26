/**
 * Entity Manager Slice
 * Manages entity sessions (characters and locations) - CRUD operations only
 * UI state is handled by entityUISlice
 */

import type { StateCreator } from 'zustand';
import { EntityUISlice } from './entityUISlice';
import {
  buildCharacterSystemPrompt,
  buildMinimalSystemPrompt,
} from '../../utils/entity/buildCharacterSystemPrompt';
import { updateEntity, updateSystemPromptInMessages } from './entityManagerHelpers';
import { sendChatMessage, createUserMessage } from './entityChatService';
import type {
  ChatMessage,
  DeepProfile,
  EntityData,
  EntityManagerSlice,
  CharacterDetails,
  EnvironmentContext,
} from './entityManagerTypes';

// Re-export types for consumers
export type { ChatMessage, DeepProfile, EntityData, EntityManagerSlice };

// Combined type for store that uses both slices
export type EntitySlices = EntityManagerSlice & EntityUISlice;

export const createEntityManagerSlice: StateCreator<EntitySlices, [], [], EntityManagerSlice> = (
  set,
  get
) => ({
  entities: new Map(),
  activeEntity: null,

  createEntity: (
    spawnId: string,
    seed: any,
    entityType?: 'character' | 'location',
    characterDetails?: CharacterDetails,
    environment?: EnvironmentContext
  ) => {
    const systemPromptContent = characterDetails
      ? buildCharacterSystemPrompt(characterDetails, environment)
      : buildMinimalSystemPrompt(seed.name, seed.personality);

    const systemMessage: ChatMessage = {
      id: 'system-001',
      role: 'system',
      content: systemPromptContent,
      timestamp: new Date().toISOString(),
    };

    const entityData: EntityData = {
      spawnId,
      entityName: seed.name,
      entityType: entityType || 'character',
      entityPersonality: seed.personality,
      systemPrompt: systemMessage.content,
      messages: [systemMessage],
    };

    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.set(spawnId, entityData);
      return { entities: newEntities, activeEntity: spawnId };
    });
  },

  updateEntityImage: (spawnId: string, imageUrl: string) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity || entity.entityImage === imageUrl) return state;
      return { entities: updateEntity(state.entities, spawnId, { entityImage: imageUrl }) };
    });
  },

  updateEntityImagePrompt: (spawnId: string, imagePrompt: string) => {
    set((state) => ({
      entities: updateEntity(state.entities, spawnId, { imagePrompt }),
    }));
  },

  updateEntitySystemPrompt: (spawnId: string, systemPrompt: string) => {
    set((state) => {
      const entity = state.entities.get(spawnId);
      if (!entity) return state;

      const updatedMessages = updateSystemPromptInMessages(entity.messages, systemPrompt);
      return {
        entities: updateEntity(state.entities, spawnId, {
          systemPrompt,
          messages: updatedMessages,
        }),
      };
    });
  },

  updateEntityProfile: (spawnId: string, deepProfile: DeepProfile) => {
    set((state) => ({
      entities: updateEntity(state.entities, spawnId, { deepProfile }),
    }));
  },

  setActiveEntity: (spawnId: string) => {
    set({ activeEntity: spawnId });
  },

  closeEntity: (spawnId: string) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.delete(spawnId);
      return {
        entities: newEntities,
        activeEntity: state.activeEntity === spawnId ? null : state.activeEntity,
      };
    });
  },

  sendMessage: async (spawnId: string, content: string) => {
    const entity = get().entities.get(spawnId);
    if (!entity) return;

    const userMessage = createUserMessage(content);

    // Add user message and set loading
    set((state) => ({
      entities: updateEntity(state.entities, spawnId, {
        messages: [...(state.entities.get(spawnId)?.messages || []), userMessage],
        loading: true,
        error: null,
      }),
    }));

    try {
      const updatedEntity = get().entities.get(spawnId);
      if (!updatedEntity) return;

      const assistantMessage = await sendChatMessage(updatedEntity, userMessage);

      set((state) => ({
        entities: updateEntity(state.entities, spawnId, {
          messages: [...(state.entities.get(spawnId)?.messages || []), assistantMessage],
          loading: false,
        }),
      }));
    } catch (error) {
      set((state) => ({
        entities: updateEntity(state.entities, spawnId, {
          loading: false,
          error: 'Failed to send message. Please try again.',
        }),
      }));
    }
  },

  setLoading: (spawnId: string, loading: boolean) => {
    set((state) => ({
      entities: updateEntity(state.entities, spawnId, { loading }),
    }));
  },

  setError: (spawnId: string, error: string | null) => {
    set((state) => ({
      entities: updateEntity(state.entities, spawnId, { error }),
    }));
  },
});
