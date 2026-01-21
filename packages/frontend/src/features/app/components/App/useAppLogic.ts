/**
 * App Logic Hook
 * Coordinates app-level hooks and provides unified state management
 */

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppInitialization } from './useAppInitialization';
import { useDisplayMode } from './useDisplayMode';
import { useTrainingData } from './useTrainingData';

// BroadcastChannel for syncing external display windows
const externalViewChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('morfeum-external-view') 
  : null;

export function useAppLogic() {
  const [isSavedEntitiesModalOpen, setIsSavedEntitiesModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  // Global keyboard shortcuts
  useKeyboardShortcuts();
  
  // Initialize app data and theme
  useAppInitialization();
  
  // Display mode and depth map management
  const {
    displayMode,
    hasDepthMap,
    depthMapGenerating,
    depthMapDisabled,
    isUpscaling,
    isGeneratingVideo,
    handleGenerateDepthMap,
    handleUpscaleImage,
    handleGenerateVideo,
    handleDisplayModeChange,
  } = useDisplayMode();
  
  // Training data management
  const {
    trainingSaving,
    trainingSaved,
    handleSaveTrainingData,
  } = useTrainingData();
  
  // Store selectors
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  const deepProfile = activeEntitySession?.deepProfile || null;
  const isCharacter = activeEntitySession?.entityType === 'character';
  const entityPanelOpen = useStore(state => state.entityPanelOpen);
  const closeEntityPanel = useStore(state => state.closeEntityPanel);
  const openEntityPanel = useStore(state => state.openEntityPanel);
  const entityExplorerPanelOpen = useStore(state => state.entityExplorerPanelOpen);
  const toggleEntityExplorerPanel = useStore(state => state.toggleEntityExplorerPanel);
  const focusModeEnabled = useStore(state => state.focusModeEnabled);

  // Handlers
  const handleOpenInfo = useCallback(() => {
    setIsInfoModalOpen(true);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setIsInfoModalOpen(false);
  }, []);

  const handleOpenChat = useCallback(() => {
    if (activeEntity) {
      openEntityPanel(activeEntity);
    }
  }, [activeEntity, openEntityPanel]);

  // Broadcast entity change to external views
  useEffect(() => {
    if (activeEntity) {
      const entitySession = entities.get(activeEntity);
      externalViewChannel?.postMessage({ 
        type: 'entityChanged', 
        entityId: activeEntity,
        imageUrl: entitySession?.entityImage || null
      });
    }
  }, [activeEntity, entities]);

  return {
    // State
    isSavedEntitiesModalOpen,
    setIsSavedEntitiesModalOpen,
    isInfoModalOpen,
    displayMode,
    hasDepthMap,
    depthMapGenerating,
    depthMapDisabled,
    isUpscaling,
    isGeneratingVideo,
    trainingSaving,
    trainingSaved,
    
    // Entity state
    activeEntity,
    entities,
    activeEntitySession,
    deepProfile,
    isCharacter,
    entityPanelOpen,
    entityExplorerPanelOpen,
    focusModeEnabled,
    
    // Handlers
    handleOpenInfo,
    handleCloseInfo,
    handleOpenChat,
    handleGenerateDepthMap,
    handleUpscaleImage,
    handleGenerateVideo,
    handleDisplayModeChange,
    handleSaveTrainingData,
    toggleEntityExplorerPanel,
    closeEntityPanel
  };
}
