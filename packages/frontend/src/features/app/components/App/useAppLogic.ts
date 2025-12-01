/**
 * App Logic Hook
 * Handles initialization, handlers, and effects for the main App component
 */

import { useStore } from '@/store';
import { useThemeStore } from '@/store/slices/themeSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { useMediaCacheStore, collectMediaIds } from '@/store/slices/mediaCacheSlice';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { useEffect, useState, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDepthMapLogic } from '@/features/app/components/TopButtonRow/useDepthMapLogic';
import { getDepthMapForMedia, clearMediaCache } from '@/services/mediaService';
import { saveTrainingData } from '@/services/trainingDataService';
import type { DisplayMode } from '@/features/app/components/TopButtonRow/TopButtonRow';

// BroadcastChannel for syncing external display windows
const externalViewChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('morfeum-external-view') 
  : null;

export function useAppLogic() {
  const [isSavedEntitiesModalOpen, setIsSavedEntitiesModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    return (localStorage.getItem('displayMode') as DisplayMode) || 'full';
  });
  const [hasDepthMap, setHasDepthMap] = useState(false);
  
  // Global keyboard shortcuts
  useKeyboardShortcuts();
  
  // Depth map generation logic
  const { generateDepthMap, isGenerating: depthMapGenerating } = useDepthMapLogic();
  
  // Theme
  const { theme } = useThemeStore();
  
  // Store selectors
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const createEntity = useStore(state => state.createEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);
  const entityPanelOpen = useStore(state => state.entityPanelOpen);
  const closeEntityPanel = useStore(state => state.closeEntityPanel);
  const openEntityPanel = useStore(state => state.openEntityPanel);
  const entityExplorerPanelOpen = useStore(state => state.entityExplorerPanelOpen);
  const toggleEntityExplorerPanel = useStore(state => state.toggleEntityExplorerPanel);
  const focusModeEnabled = useStore(state => state.focusModeEnabled);
  
  // Get active entity session
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  const deepProfile = activeEntitySession?.deepProfile || null;
  const isCharacter = activeEntitySession?.entityType === 'character';

  // Initialize theme on component mount
  useEffect(() => {
    const resolvedTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme]);

  // Initialize worlds and characters from backend
  useEffect(() => {
    const initializeData = async () => {
      const initializeWorldsFromBackend = useLocationsStore.getState().initializeFromBackend;
      await initializeWorldsFromBackend();
      
      const initializeCharactersFromBackend = useCharactersStore.getState().initializeFromBackend;
      await initializeCharactersFromBackend();
      
      const pinnedCharacters = useCharactersStore.getState().getPinnedCharacters();
      const pinnedLocations = useLocationsStore.getState().getPinnedNodes();
      const nodes = useLocationsStore.getState().nodes;
      
      const allMediaIds = collectMediaIds({
        characters: pinnedCharacters,
        nodes: nodes
      });
      
      const loadMediaBulk = useMediaCacheStore.getState().loadMediaBulk;
      await loadMediaBulk(allMediaIds);
      
      const getMediaUrl = useMediaCacheStore.getState().getMediaUrl;
      
      let lastLoadedId: string | null = null;
    
      pinnedCharacters.forEach((character) => {
        const seed = {
          name: character.name,
          personality: character.details.personality || 'Unknown personality'
        };
        
        createEntity(character.id, seed, 'character');
        
        const imageUrl = getMediaUrl(character.primaryMedia);
        if (imageUrl) {
          updateEntityImage(character.id, imageUrl);
        }
        
        updateEntityProfile(character.id, character.details as any);
        lastLoadedId = character.id;
      });
    
      const getCascadedDNA = useLocationsStore.getState().getCascadedDNA;
      const getWorldTree = useLocationsStore.getState().getWorldTree;
    
      pinnedLocations.forEach((node) => {
        const cascadedDNA = getCascadedDNA(node.id);
        
        if (!cascadedDNA.world) {
          console.warn('[App] Skipping node with missing world DNA:', node.id);
          return;
        }
        
        const seed = {
          name: node.name,
          atmosphere: cascadedDNA.world.semantic?.atmosphere || 'Unknown atmosphere'
        };
        
        createEntity(node.id, seed, 'location');
        
        const imageUrl = getMediaUrl(node.primaryMedia);
        if (imageUrl) {
          updateEntityImage(node.id, imageUrl);
        }
        
        updateEntityProfile(node.id, cascadedDNA as any);
        lastLoadedId = node.id;
        
        if (node.type === 'host') {
          const worldTree = getWorldTree(node.id);
          
          if (worldTree) {
            const allNodeIds = collectAllNodeIds(worldTree);
            const childNodeIds = allNodeIds.slice(1);
            
            createEntitySessionsForNodes(
              childNodeIds,
              { createEntity, updateEntityImage, updateEntityProfile }
            );
          }
        }
      });
    
      const savedActiveId = localStorage.getItem('lastActiveEntityId');
      if (savedActiveId && useStore.getState().entities.get(savedActiveId)) {
          setActiveEntity(savedActiveId);
      } else if (lastLoadedId) {
        setActiveEntity(lastLoadedId);
      }
    };
    
    initializeData();
  }, []);

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

  // Get primary media ID for current entity
  const getPrimaryMediaId = useCallback(() => {
    if (!activeEntity) return null;
    
    if (isCharacter) {
      const character = useCharactersStore.getState().getCharacter(activeEntity);
      return character?.primaryMedia || null;
    } else {
      const node = useLocationsStore.getState().getNode(activeEntity);
      return node?.primaryMedia || null;
    }
  }, [activeEntity, isCharacter]);

  const handleGenerateDepthMap = useCallback(async () => {
    if (!activeEntity) return;
    
    const primaryMediaId = getPrimaryMediaId();
    if (!primaryMediaId) {
      console.warn('No primary media found for entity:', activeEntity);
      return;
    }
    
    await generateDepthMap(activeEntity, primaryMediaId);
    
    window.dispatchEvent(new CustomEvent('depthMapGenerated'));
    setHasDepthMap(true);
    setDisplayMode('full');
    localStorage.setItem('displayMode', 'full');
    window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: 'full' } }));
  }, [activeEntity, getPrimaryMediaId, generateDepthMap]);

  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    localStorage.setItem('displayMode', mode);
    window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode } }));
    externalViewChannel?.postMessage({ type: 'displayModeChanged', mode });
  }, []);

  const handleSaveTrainingData = useCallback(async () => {
    if (!activeEntity || !activeEntitySession?.entityImage) return;
    
    let text = '';
    let name = activeEntitySession.entityName || 'entity';
    
    if (isCharacter) {
      // Get character's details.looks with "A portrait of " prefix
      const character = useCharactersStore.getState().getCharacter(activeEntity);
      const looks = character?.details?.looks || '';
      text = looks ? `A portrait of ${looks}` : '';
    } else {
      // Get location's description with "A scene of " prefix
      const node = useLocationsStore.getState().getNode(activeEntity);
      const description = (node as any)?.description || '';
      text = description ? `A scene of ${description}` : '';
    }
    
    if (!text) {
      return;
    }
    
    await saveTrainingData({
      imageUrl: activeEntitySession.entityImage,
      text,
      name
    });
  }, [activeEntity, activeEntitySession, isCharacter]);

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

  // Check for existing depth map when active entity changes
  useEffect(() => {
    const checkDepthMap = async () => {
      const primaryMediaId = getPrimaryMediaId();
      if (!primaryMediaId) {
        setHasDepthMap(false);
        if (displayMode !== '2d') {
          setDisplayMode('2d');
          localStorage.setItem('displayMode', '2d');
          window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: '2d' } }));
        }
        return;
      }
      
      clearMediaCache();
      
      const depthMap = await getDepthMapForMedia(primaryMediaId);
      const hasDepth = !!depthMap;
      setHasDepthMap(hasDepth);
      
      if (!hasDepth && displayMode !== '2d') {
        setDisplayMode('2d');
        localStorage.setItem('displayMode', '2d');
        window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: '2d' } }));
      }
      
      if (hasDepth && displayMode === '2d') {
        setDisplayMode('full');
        localStorage.setItem('displayMode', 'full');
        window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: 'full' } }));
      }
    };
    
    checkDepthMap();
  }, [activeEntity, getPrimaryMediaId, displayMode]);

  const depthMapDisabled = !activeEntity || !getPrimaryMediaId();

  return {
    // State
    isSavedEntitiesModalOpen,
    setIsSavedEntitiesModalOpen,
    isInfoModalOpen,
    displayMode,
    hasDepthMap,
    depthMapGenerating,
    depthMapDisabled,
    
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
    handleDisplayModeChange,
    handleSaveTrainingData,
    toggleEntityExplorerPanel,
    closeEntityPanel
  };
}
