import { useCallback, useMemo } from 'react';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { useStore } from '@/store';
import { splitWorldAndLocation } from '@/utils/locationProfile';
import type { SavedLocationsLogicReturn } from './types';
import type { Location } from '@/store/slices/locationsSlice';

export function useSavedLocationsLogic(onClose: () => void): SavedLocationsLogicReturn {
  const locationsMap = useLocationsStore(state => state.locations);
  const locations = useMemo(() => Object.values(locationsMap), [locationsMap]);
  const deleteLocation = useLocationsStore(state => state.deleteLocation);
  const createChatWithEntity = useStore(state => state.createChatWithEntity);
  const setActiveChat = useStore(state => state.setActiveChat);
  const updateChatImage = useStore(state => state.updateChatImage);
  const updateChatDeepProfile = useStore(state => state.updateChatDeepProfile);

  const handleLoadLocation = useCallback((location: Location) => {
    console.log('[SavedLocationsModal] Loading location:', location.id);
    
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
    
    console.log('[SavedLocationsModal] Location loaded successfully');
  }, [createChatWithEntity, updateChatImage, updateChatDeepProfile, setActiveChat, onClose]);

  const handleDeleteLocation = useCallback((locationId: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      console.log('[SavedLocationsModal] Deleting location:', locationId);
      deleteLocation(locationId);
    }
  }, [deleteLocation]);

  return {
    locations,
    handleLoadLocation,
    handleDeleteLocation
  };
}
