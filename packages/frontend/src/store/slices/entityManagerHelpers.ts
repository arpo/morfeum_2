/**
 * Entity Manager Helpers
 * Utility functions for entity state updates
 */

import type { EntityData } from './entityManagerTypes';

/**
 * Update an entity in the entities Map
 * Returns a new Map with the updated entity or the original state if entity not found
 */
export function updateEntity(
  entities: Map<string, EntityData>,
  spawnId: string,
  updates: Partial<EntityData>
): Map<string, EntityData> {
  const entity = entities.get(spawnId);
  if (!entity) return entities;

  const newEntities = new Map(entities);
  newEntities.set(spawnId, { ...entity, ...updates });
  return newEntities;
}

/**
 * Update entity messages and optionally other fields
 */
export function updateEntityMessages(
  entities: Map<string, EntityData>,
  spawnId: string,
  messageUpdates: {
    messages?: EntityData['messages'];
    loading?: boolean;
    error?: string | null;
  }
): Map<string, EntityData> {
  return updateEntity(entities, spawnId, messageUpdates);
}

/**
 * Update system prompt in entity messages
 */
export function updateSystemPromptInMessages(
  messages: EntityData['messages'],
  newSystemPrompt: string
): EntityData['messages'] {
  const updatedMessages = [...messages];
  const systemMessageIndex = updatedMessages.findIndex((m) => m.role === 'system');

  if (systemMessageIndex !== -1) {
    updatedMessages[systemMessageIndex] = {
      ...updatedMessages[systemMessageIndex],
      content: newSystemPrompt,
    };
  }

  return updatedMessages;
}
