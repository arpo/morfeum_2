/**
 * Entity Chat Service
 * Handles API communication for entity chat functionality
 */

import type { ChatMessage, EntityData } from './entityManagerTypes';

/**
 * Send a message to the LLM API and get a response
 */
export async function sendChatMessage(
  entity: EntityData,
  userMessage: ChatMessage
): Promise<ChatMessage> {
  const apiMessages = [...entity.messages, userMessage].map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch('/api/mzoo/gemini/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: apiMessages,
      model: 'gemini-2.5-flash-lite',
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: result.data.text,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a user message object
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
}
