import { useState, useCallback, useMemo } from 'react';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useStore } from '@/store';
import { splitWorldAndLocation } from '@/utils/locationProfile';
import type { SavedEntitiesLogicReturn, EntityTab } from './types';
import type { Location } from '@/store/slices/locationsSlice';
import type { Character } from '@/store/slices/charactersSlice';

export function useSavedEntitiesLogic(onClose: () => void): SavedEntitiesLogicReturn {
  const [activeTab, setActiveTab] = useState<EntityTab>('characters');
  
  // Locations
  const locationsMap = useLocationsStore(state => state.locations);
  const locations = useMemo(() => Object.values(locationsMap), [locationsMap]);
  const pinnedLocationId = useLocationsStore(state => state.pinnedId);
  const deleteLocation = useLocationsStore(state => state.deleteLocation);
  const setPinnedLocation = useLocationsStore(state => state.setPinned);
  const clearPinnedLocation = useLocationsStore(state => state.clearPinned);
  
  // Characters
  const charactersMap = useCharactersStore(state => state.characters);
  const characters = useMemo(() => Object.values(charactersMap), [charactersMap]);
  const pinnedCharacterId = useCharactersStore(state => state.pinnedId);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);
  const setPinnedCharacter = useCharactersStore(state => state.setPinned);
  const clearPinnedCharacter = useCharactersStore(state => state.clearPinned);
  
  // Chat management
  const createChatWithEntity = useStore(state => state.createChatWithEntity);
  const setActiveChat = useStore(state => state.setActiveChat);
  const updateChatImage = useStore(state => state.updateChatImage);
  const updateChatDeepProfile = useStore(state => state.updateChatDeepProfile);

  const handleLoadLocation = useCallback((location: Location) => {
    console.log('[SavedEntitiesModal] Loading location:', location.id);
    
    // Reconstruct the deep profile from locationInfo and worldInfo
    const deepProfile = {
      ...location.locationInfo,
      ...location.worldInfo
    };
    
    // Create seed data for chat initialization
    const seed = {
      name: location.name,
      atmosphere: location.worldInfo.atmosphere || 'Unknown atmosphere'
    };
    
    // Create chat session for this location
    createChatWithEntity(location.id, seed, 'location');
    
    // Update chat with image and deep profile
    if (location.imagePath) {
      updateChatImage(location.id, location.imagePath);
    }
    
    updateChatDeepProfile(location.id, deepProfile as any);
    
    // Set as active chat
    setActiveChat(location.id);
    
    // Close modal
    onClose();
    
    console.log('[SavedEntitiesModal] Location loaded successfully');
  }, [createChatWithEntity, updateChatImage, updateChatDeepProfile, setActiveChat, onClose]);

  const handleLoadCharacter = useCallback((character: Character) => {
    console.log('[SavedEntitiesModal] Loading character:', character.id);
    
    // Create seed data for chat initialization
    const seed = {
      name: character.name,
      personality: character.details.personality || 'Unknown personality'
    };
    
    // Create chat session for this character
    createChatWithEntity(character.id, seed, 'character');
    
    // Update chat with image and deep profile
    if (character.imagePath) {
      updateChatImage(character.id, character.imagePath);
    }
    
    updateChatDeepProfile(character.id, character.details as any);
    
    // Set as active chat
    setActiveChat(character.id);
    
    // Close modal
    onClose();
    
    console.log('[SavedEntitiesModal] Character loaded successfully');
  }, [createChatWithEntity, updateChatImage, updateChatDeepProfile, setActiveChat, onClose]);

  const handleDeleteLocation = useCallback((locationId: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      console.log('[SavedEntitiesModal] Deleting location:', locationId);
      deleteLocation(locationId);
    }
  }, [deleteLocation]);

  const handleDeleteCharacter = useCallback((characterId: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      console.log('[SavedEntitiesModal] Deleting character:', characterId);
      deleteCharacter(characterId);
    }
  }, [deleteCharacter]);

  const handlePinLocation = useCallback((locationId: string) => {
    if (pinnedLocationId === locationId) {
      // Unpin if already pinned
      clearPinnedLocation();
      console.log('[SavedEntitiesModal] Unpinned location:', locationId);
    } else {
      // Pin this location
      setPinnedLocation(locationId);
      console.log('[SavedEntitiesModal] Pinned location:', locationId);
    }
  }, [pinnedLocationId, setPinnedLocation, clearPinnedLocation]);

  const handlePinCharacter = useCallback((characterId: string) => {
    if (pinnedCharacterId === characterId) {
      // Unpin if already pinned
      clearPinnedCharacter();
      console.log('[SavedEntitiesModal] Unpinned character:', characterId);
    } else {
      // Pin this character
      setPinnedCharacter(characterId);
      console.log('[SavedEntitiesModal] Pinned character:', characterId);
    }
  }, [pinnedCharacterId, setPinnedCharacter, clearPinnedCharacter]);

  return {
    activeTab,
    setActiveTab,
    locations,
    characters,
    pinnedLocationId,
    pinnedCharacterId,
    handleLoadLocation,
    handleLoadCharacter,
    handleDeleteLocation,
    handleDeleteCharacter,
    handlePinLocation,
    handlePinCharacter
  };
}
