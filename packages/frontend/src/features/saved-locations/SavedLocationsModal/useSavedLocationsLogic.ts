import { useState, useCallback, useMemo } from 'react';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useStore } from '@/store';
import type { SavedEntitiesLogicReturn, EntityTab } from './types';
import type { Location } from '@/store/slices/locationsSlice';
import type { Character } from '@/store/slices/charactersSlice';

export function useSavedEntitiesLogic(onClose: () => void): SavedEntitiesLogicReturn {
  const [activeTab, setActiveTab] = useState<EntityTab>('characters');
  
  // Locations
  const locationsMap = useLocationsStore(state => state.locations);
  const locations = useMemo(() => Object.values(locationsMap), [locationsMap]);
  const pinnedLocationIds = useLocationsStore(state => state.pinnedIds);
  const deleteLocation = useLocationsStore(state => state.deleteLocation);
  const togglePinnedLocation = useLocationsStore(state => state.togglePinned);
  const isLocationPinned = useLocationsStore(state => state.isPinned);
  
  // Characters
  const charactersMap = useCharactersStore(state => state.characters);
  const characters = useMemo(() => Object.values(charactersMap), [charactersMap]);
  const pinnedCharacterIds = useCharactersStore(state => state.pinnedIds);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);
  const togglePinnedCharacter = useCharactersStore(state => state.togglePinned);
  const isCharacterPinned = useCharactersStore(state => state.isPinned);
  
  // Chat management
  const createChatWithEntity = useStore(state => state.createChatWithEntity);
  const setActiveChat = useStore(state => state.setActiveChat);
  const updateChatImage = useStore(state => state.updateChatImage);
  const updateChatDeepProfile = useStore(state => state.updateChatDeepProfile);

  const handleLoadLocation = useCallback((location: Location) => {
    console.log('[SavedEntitiesModal] Loading location:', location.id);
    
    // Check if location has new hierarchical structure
    if (!location.dna || !location.dna.world) {
      console.error('[SavedEntitiesModal] Cannot load location with old data structure. Please regenerate this location.');
      alert('This location uses an outdated format. Please delete and regenerate it.');
      return;
    }
    
    // Use hierarchical DNA structure
    const deepProfile = location.dna;
    
    // Create seed data for chat initialization
    const seed = {
      name: location.name,
      atmosphere: location.dna.world.semantic?.atmosphere || 'Unknown atmosphere'
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
    const isPinned = isLocationPinned(locationId);
    togglePinnedLocation(locationId);
    console.log(`[SavedEntitiesModal] ${isPinned ? 'Unpinned' : 'Pinned'} location:`, locationId);
  }, [togglePinnedLocation, isLocationPinned]);

  const handlePinCharacter = useCallback((characterId: string) => {
    const isPinned = isCharacterPinned(characterId);
    togglePinnedCharacter(characterId);
    console.log(`[SavedEntitiesModal] ${isPinned ? 'Unpinned' : 'Pinned'} character:`, characterId);
  }, [togglePinnedCharacter, isCharacterPinned]);

  const handleCopyWorldInfo = useCallback((location: Location) => {
    console.log('[SavedEntitiesModal] Copying full location JSON for:', location.id);
    
    // Copy the entire location object as JSON
    const locationJson = JSON.stringify(location, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(locationJson)
      .then(() => {
        console.log('[SavedEntitiesModal] Location JSON copied to clipboard');
        alert('Location data copied to clipboard!');
      })
      .catch((err) => {
        console.error('[SavedEntitiesModal] Failed to copy location data:', err);
        alert('Failed to copy location data. Please try again.');
      });
  }, []);

  return {
    activeTab,
    setActiveTab,
    locations,
    characters,
    pinnedLocationIds,
    pinnedCharacterIds,
    handleLoadLocation,
    handleLoadCharacter,
    handleDeleteLocation,
    handleDeleteCharacter,
    handlePinLocation,
    handlePinCharacter,
    handleCopyWorldInfo
  };
}
