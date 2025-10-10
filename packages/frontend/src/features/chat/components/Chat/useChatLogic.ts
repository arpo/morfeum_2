import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { splitWorldAndLocation } from '@/utils/locationProfile';
import type { ChatLogicReturn } from './types';

export function useChatLogic(): ChatLogicReturn {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [movementInput, setMovementInput] = useState('');
  
  const activeChat = useStore(state => state.activeChat);
  const chats = useStore(state => state.chats);
  const sendMessageToStore = useStore(state => state.sendMessage);
  const setError = useStore(state => state.setError);
  
  const createLocation = useLocationsStore(state => state.createLocation);
  
  const createCharacter = useCharactersStore(state => state.createCharacter);
  const getCharacter = useCharactersStore(state => state.getCharacter);
  
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

  const saveLocation = useCallback(() => {
    if (!activeChatSession || !activeChat) {
      console.warn('[useChatLogic] Cannot save: no active chat session');
      return;
    }
    
    const deepProfile = activeChatSession.deepProfile;
    if (!deepProfile) {
      console.warn('[useChatLogic] Cannot save: no deep profile data');
      return;
    }
    
    // Split the deep profile into world and location data
    const { world, location } = splitWorldAndLocation(deepProfile as Record<string, any>);
    
    // Create location in storage
    createLocation({
      id: activeChat, // Use spawnId as location ID
      world_id: activeChat, // Use same ID for world
      name: activeChatSession.entityName || 'Unnamed Location',
      locationInfo: location,
      worldInfo: world,
      imagePath: activeChatSession.entityImage || '',
      parent_location_id: null,
      adjacent_to: [],
      children: [],
      depth_level: 0
    });
    
    setIsSaved(true);
    console.log(`[useChatLogic] Location saved with ID: ${activeChat}`);
  }, [activeChatSession, activeChat, createLocation]);

  const saveCharacter = useCallback(() => {
    if (!activeChatSession || !activeChat) {
      console.warn('[useChatLogic] Cannot save: no active chat session');
      return;
    }
    
    const deepProfile = activeChatSession.deepProfile;
    if (!deepProfile) {
      console.warn('[useChatLogic] Cannot save: no deep profile data');
      return;
    }
    
    // Create character in storage
    createCharacter({
      id: activeChat, // Use spawnId as character ID
      name: activeChatSession.entityName || 'Unnamed Character',
      details: deepProfile as Record<string, any>,
      imagePath: activeChatSession.entityImage || ''
    });
    
    setIsSaved(true);
    console.log(`[useChatLogic] Character saved with ID: ${activeChat}`);
  }, [activeChatSession, activeChat, createCharacter]);

  const handleMove = useCallback(async () => {
    // Movement logic removed - UI only
    console.log('[useChatLogic] Movement input:', movementInput);
  }, [movementInput]);

  // Check if entity is already saved when active chat changes
  useEffect(() => {
    if (activeChat && activeChatSession) {
      if (activeChatSession.entityType === 'location') {
        // Location save check removed
        setIsSaved(false);
      } else {
        const existingCharacter = getCharacter(activeChat);
        setIsSaved(!!existingCharacter);
      }
    } else {
      setIsSaved(false);
    }
  }, [activeChat, activeChatSession, getCharacter]);

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
      deepProfile: activeChatSession?.deepProfile || null,
      isModalOpen,
      isFullscreenOpen,
      isSaved,
      movementInput,
      isMoving: false
    },
    handlers: {
      setInputValue,
      sendMessage,
      clearError,
      initializeWithEntity: async () => {}, // Deprecated - entities are managed by spawn system
      openModal,
      closeModal,
      openFullscreen,
      closeFullscreen,
      saveLocation,
      saveCharacter,
      setMovementInput,
      handleMove
    }
  };
}
