import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';

/**
 * Base hook for entity panels - contains shared logic used by both
 * character and location panels
 */
export function useEntityPanelBase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const activeChat = useStore(state => state.activeChat);
  const chats = useStore(state => state.chats);
  
  // Get active chat session
  const activeChatSession = activeChat ? chats.get(activeChat) : null;

  // Reset isSaved when switching to a different entity
  useEffect(() => {
    setIsSaved(false);
  }, [activeChat]);

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
    // Shared state
    activeChat,
    activeChatSession,
    entityImage: activeChatSession?.entityImage || null,
    entityName: activeChatSession?.entityName || null,
    entityPersonality: activeChatSession?.entityPersonality || null,
    deepProfile: activeChatSession?.deepProfile || null,
    isModalOpen,
    isFullscreenOpen,
    isSaved,
    setIsSaved,
    
    // Shared handlers
    openModal,
    closeModal,
    openFullscreen,
    closeFullscreen
  };
}
