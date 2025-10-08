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

export interface ChatSession {
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

export interface ChatManagerSlice {
  chats: Map<string, ChatSession>;
  activeChat: string | null;

  createChatWithEntity: (spawnId: string, seed: any, entityType?: 'character' | 'location') => void;
  updateChatImage: (spawnId: string, imageUrl: string) => void;
  updateChatImagePrompt: (spawnId: string, imagePrompt: string) => void;
  updateChatSystemPrompt: (spawnId: string, systemPrompt: string) => void;
  updateChatDeepProfile: (spawnId: string, deepProfile: DeepProfile) => void;
  setActiveChat: (spawnId: string) => void;
  closeChat: (spawnId: string) => void;
  sendMessage: (spawnId: string, content: string) => Promise<void>;
  setLoading: (spawnId: string, loading: boolean) => void;
  setError: (spawnId: string, error: string | null) => void;
}

export const createChatManagerSlice: StateCreator<ChatManagerSlice> = (set, get) => ({
  chats: new Map(),
  activeChat: null,

  createChatWithEntity: (spawnId: string, seed: any, entityType?: 'character' | 'location') => {
    console.log('[ChatManager] Creating chat for spawn:', spawnId, 'type:', entityType);
    
    const systemMessage: ChatMessage = {
      id: 'system-001',
      role: 'system',
      content: `You are ${seed.name}. ${seed.personality}`,
      timestamp: new Date().toISOString()
    };

    const chatSession: ChatSession = {
      spawnId,
      entityName: seed.name,
      entityType: entityType || 'character',
      entityPersonality: seed.personality,
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

  updateChatImagePrompt: (spawnId: string, imagePrompt: string) => {
    console.log('[ChatManager] Updating chat image prompt for spawn:', spawnId);
    
    set((state) => {
      const chat = state.chats.get(spawnId);
      if (!chat) return state;

      const newChats = new Map(state.chats);
      newChats.set(spawnId, {
        ...chat,
        imagePrompt
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

  updateChatDeepProfile: (spawnId: string, deepProfile: DeepProfile) => {
    console.log('[ChatManager] Updating deep profile for spawn:', spawnId);
    
    set((state) => {
      const chat = state.chats.get(spawnId);
      if (!chat) return state;

      const newChats = new Map(state.chats);
      newChats.set(spawnId, {
        ...chat,
        deepProfile
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
  },

  sendMessage: async (spawnId: string, content: string) => {
    const state = get();
    const chat = state.chats.get(spawnId);
    
    if (!chat) {
      console.error('[ChatManager] Chat not found:', spawnId);
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
      const newChats = new Map(state.chats);
      const chat = newChats.get(spawnId);
      if (!chat) return state;

      newChats.set(spawnId, {
        ...chat,
        messages: [...chat.messages, userMessage],
        loading: true,
        error: null
      });
      return { chats: newChats };
    });

    try {
      // Prepare messages for API (include system prompt and full history)
      const updatedChat = get().chats.get(spawnId);
      if (!updatedChat) return;

      const apiMessages = updatedChat.messages.map(m => ({
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
        const newChats = new Map(state.chats);
        const chat = newChats.get(spawnId);
        if (!chat) return state;

        newChats.set(spawnId, {
          ...chat,
          messages: [...chat.messages, assistantMessage],
          loading: false
        });
        return { chats: newChats };
      });

      console.log('💬 Message sent and response received');
    } catch (error) {
      console.error('[ChatManager] Error sending message:', error);
      
      set((state) => {
        const newChats = new Map(state.chats);
        const chat = newChats.get(spawnId);
        if (!chat) return state;

        newChats.set(spawnId, {
          ...chat,
          loading: false,
          error: 'Failed to send message. Please try again.'
        });
        return { chats: newChats };
      });
    }
  },

  setLoading: (spawnId: string, loading: boolean) => {
    set((state) => {
      const chat = state.chats.get(spawnId);
      if (!chat) return state;

      const newChats = new Map(state.chats);
      newChats.set(spawnId, {
        ...chat,
        loading
      });
      return { chats: newChats };
    });
  },

  setError: (spawnId: string, error: string | null) => {
    set((state) => {
      const chat = state.chats.get(spawnId);
      if (!chat) return state;

      const newChats = new Map(state.chats);
      newChats.set(spawnId, {
        ...chat,
        error
      });
      return { chats: newChats };
    });
  }
});
