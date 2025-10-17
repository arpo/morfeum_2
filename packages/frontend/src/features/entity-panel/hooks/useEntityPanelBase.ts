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
  
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  
  // Get active entity session
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;

  // Reset isSaved when switching to a different entity
  useEffect(() => {
    setIsSaved(false);
  }, [activeEntity]);

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
    activeChat: activeEntity,
    activeChatSession: activeEntitySession,
    entityImage: activeEntitySession?.entityImage || null,
    entityName: activeEntitySession?.entityName || null,
    entityPersonality: activeEntitySession?.entityPersonality || null,
    deepProfile: activeEntitySession?.deepProfile || null,
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
