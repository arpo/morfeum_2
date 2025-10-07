/**
 * Chat Manager Slice
 * Manages multiple chat sessions, one per spawned entity
 */

import type { StateCreator } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  spawnId: string;
  entityName: string;
  entityImage?: string;
  systemPrompt: string;
  messages: ChatMessage[];
}

export interface ChatManagerSlice {
  chats: Map<string, ChatSession>;
  activeChat: string | null;

  createChatWithEntity: (spawnId: string, seed: any) => void;
  updateChatImage: (spawnId: string, imageUrl: string) => void;
  updateChatSystemPrompt: (spawnId: string, systemPrompt: string) => void;
  setActiveChat: (spawnId: string) => void;
  closeChat: (spawnId: string) => void;
}

export const createChatManagerSlice: StateCreator<ChatManagerSlice> = (set, get) => ({
  chats: new Map(),
  activeChat: null,

  createChatWithEntity: (spawnId: string, seed: any) => {
    console.log('[ChatManager] Creating chat for spawn:', spawnId);
    
    const systemMessage: ChatMessage = {
      id: 'system-001',
      role: 'system',
      content: `You are ${seed.name}. ${seed.personality}`,
      timestamp: new Date().toISOString()
    };

    const chatSession: ChatSession = {
      spawnId,
      entityName: seed.name,
      systemPrompt: systemMessage.content,
      messages: [systemMessage]
    };

    set((state) => {
      const newChats = new Map(state.chats);
      newChats.set(spawnId, chatSession);
      return {
        chats: newChats,
        activeChat: spawnId // Automatically switch to new chat
      };
    });
  },

  updateChatImage: (spawnId: string, imageUrl: string) => {
    console.log('[ChatManager] Updating chat image for spawn:', spawnId);
    
    set((state) => {
      const chat = state.chats.get(spawnId);
      if (!chat) return state;

      const newChats = new Map(state.chats);
      newChats.set(spawnId, {
        ...chat,
        entityImage: imageUrl
      });
      return { chats: newChats };
    });
  },

  updateChatSystemPrompt: (spawnId: string, systemPrompt: string) => {
    console.log('[ChatManager] Updating system prompt for spawn:', spawnId);
    
    set((state) => {
      const chat = state.chats.get(spawnId);
      if (!chat) return state;

      const newChats = new Map(state.chats);
      const updatedMessages = [...chat.messages];
      
      // Update the system message if it exists
      const systemMessageIndex = updatedMessages.findIndex(m => m.role === 'system');
      if (systemMessageIndex !== -1) {
        updatedMessages[systemMessageIndex] = {
          ...updatedMessages[systemMessageIndex],
          content: systemPrompt
        };
      }

      newChats.set(spawnId, {
        ...chat,
        systemPrompt,
        messages: updatedMessages
      });
      return { chats: newChats };
    });
  },

  setActiveChat: (spawnId: string) => {
    set({ activeChat: spawnId });
  },

  closeChat: (spawnId: string) => {
    set((state) => {
      const newChats = new Map(state.chats);
      newChats.delete(spawnId);
      
      // If we're closing the active chat, clear activeChat
      const newActiveChat = state.activeChat === spawnId ? null : state.activeChat;
      
      return {
        chats: newChats,
        activeChat: newActiveChat
      };
    });
  }
});
