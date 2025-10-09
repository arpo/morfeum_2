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
  const [isMoving, setIsMoving] = useState(false);
  
  const activeChat = useStore(state => state.activeChat);
  const chats = useStore(state => state.chats);
  const sendMessageToStore = useStore(state => state.sendMessage);
  const setError = useStore(state => state.setError);
  
  const createLocation = useLocationsStore(state => state.createLocation);
  const getLocation = useLocationsStore(state => state.getLocation);
  
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
    if (!movementInput.trim() || !activeChat || !activeChatSession) {
      console.warn('[useChatLogic] Cannot move: missing required data');
      return;
    }

    setIsMoving(true);

    try {
      // Step 1: Classify movement
      const classifyResponse = await fetch('/api/spawn/classify-movement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCommand: movementInput.trim(),
          currentLocationName: activeChatSession.entityName || 'Unknown',
          knownLocationNames: 'None listed',
        }),
      });

      if (!classifyResponse.ok) {
        throw new Error('Movement classification failed');
      }

      const classifyData = await classifyResponse.json();
      const movementType = classifyData.data.movementType;

      console.log(`[useChatLogic] Movement classified as: ${movementType}`);

      // Get current location from storage
      const currentLocation = getLocation(activeChat);
      
      console.log('[useChatLogic] Current location data:', {
        locationId: activeChat,
        locationExists: !!currentLocation,
        worldInfo: currentLocation?.worldInfo,
        locationInfo: currentLocation?.locationInfo,
        depthLevel: currentLocation?.depth_level,
        parentLocationId: currentLocation?.parent_location_id
      });
      
      if (!currentLocation && movementType !== 'jump') {
        throw new Error('Current location not found. Please save location first.');
      }

      // Step 2: Handle movement based on type
      let movementContext: any = null;

      switch (movementType) {
        case 'ascend':
          // Navigate to parent location
          if (!currentLocation?.parent_location_id) {
            throw new Error('Cannot ascend - no parent location exists');
          }
          const parentLocation = getLocation(currentLocation.parent_location_id);
          if (!parentLocation) {
            throw new Error('Parent location not found');
          }
          // TODO: Switch to parent location chat
          console.log('[useChatLogic] Ascend to:', parentLocation.name);
          setIsMoving(false);
          setMovementInput('');
          return;

        case 'descend':
          movementContext = {
            movementType: 'descend',
            currentLocationId: activeChat,
            currentLocationName: activeChatSession.entityName || 'Unknown',
            worldInfo: currentLocation?.worldInfo,
            locationInfo: currentLocation?.locationInfo,
            parentLocationId: activeChat,
            adjacentTo: [],
            depthLevel: (currentLocation?.depth_level || 0) + 1,
          };
          break;

        case 'traverse':
          movementContext = {
            movementType: 'traverse',
            currentLocationId: activeChat,
            currentLocationName: activeChatSession.entityName || 'Unknown',
            worldInfo: currentLocation?.worldInfo,
            locationInfo: currentLocation?.locationInfo,
            parentLocationId: currentLocation?.parent_location_id || null,
            adjacentTo: [activeChat],
            depthLevel: currentLocation?.depth_level || 0,
          };
          break;

        case 'jump':
          movementContext = {
            movementType: 'jump',
            currentLocationId: activeChat,
            currentLocationName: activeChatSession.entityName || 'Unknown',
            worldInfo: currentLocation?.worldInfo || null,
            parentLocationId: null,
            adjacentTo: [],
            depthLevel: 0,
          };
          break;
      }

      // Step 3: Start spawn with movement context
      const spawnResponse = await fetch('/api/spawn/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: movementInput.trim(),
          entityType: 'location',
          movementContext,
        }),
      });

      if (!spawnResponse.ok) {
        throw new Error('Failed to start location spawn');
      }

      const spawnData = await spawnResponse.json();
      console.log(`[useChatLogic] Location spawn started:`, spawnData.data.spawnId);

      // Success - the new location will appear via SSE events

    } catch (error) {
      console.error('[useChatLogic] Movement failed:', error);
      if (activeChat) {
        setError(activeChat, error instanceof Error ? error.message : 'Movement failed. Please try again.');
      }
    } finally {
      setIsMoving(false);
      setMovementInput('');
    }
  }, [movementInput, activeChat, activeChatSession, setError, getLocation]);

  // Check if entity is already saved when active chat changes
  useEffect(() => {
    if (activeChat && activeChatSession) {
      if (activeChatSession.entityType === 'location') {
        const existingLocation = getLocation(activeChat);
        setIsSaved(!!existingLocation);
      } else {
        const existingCharacter = getCharacter(activeChat);
        setIsSaved(!!existingCharacter);
      }
    } else {
      setIsSaved(false);
    }
  }, [activeChat, activeChatSession, getLocation, getCharacter]);

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
      isMoving
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
