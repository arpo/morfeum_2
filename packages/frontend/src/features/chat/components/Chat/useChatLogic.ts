import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import type { ChatLogicReturn } from './types';

export function useChatLogic(): ChatLogicReturn {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  
  const activeChat = useStore(state => state.activeChat);
  const chats = useStore(state => state.chats);
  const sendMessageToStore = useStore(state => state.sendMessage);
  const setError = useStore(state => state.setError);
  
  // Get active chat session
  const activeChatSession = activeChat ? chats.get(activeChat) : null;

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !activeChat) return;

    await sendMessageToStore(activeChat, inputValue);
    setInputValue('');
  }, [inputValue, activeChat, sendMessageToStore]);

  const clearError = useCallback(() => {
    if (activeChat) {
      setError(activeChat, null);
    }
  }, [activeChat, setError]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const openFullscreen = useCallback(() => {
    setIsFullscreenOpen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
  }, []);

  // Handle ESC key for fullscreen
  useEffect(() => {
    if (!isFullscreenOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreenOpen, closeFullscreen]);

  return {
    state: {
      messages: activeChatSession?.messages || [],
      inputValue,
      loading: activeChatSession?.loading || false,
      error: activeChatSession?.error || null,
      entityImage: activeChatSession?.entityImage || null,
      entityName: activeChatSession?.entityName || null,
      entityPersonality: activeChatSession?.entityPersonality || null,
      deepProfile: activeChatSession?.deepProfile,
      isModalOpen,
      isFullscreenOpen
    },
    handlers: {
      setInputValue,
      sendMessage,
      clearError,
      initializeWithEntity: async () => {}, // Deprecated - entities are managed by spawn system
      openModal,
      closeModal,
      openFullscreen,
      closeFullscreen
    }
  };
}
