import { useStore } from '@/store';
import { useThemeStore } from '@/store/slices/themeSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { useMediaCacheStore, collectMediaIds } from '@/store/slices/mediaCacheSlice';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { ImagePromptPanel } from '@/features/chat/components/ImagePromptPanel';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { CharacterInfoModal } from '@/features/chat/components/CharacterInfoModal';
import { LocationInfoModal } from '@/features/chat/components/LocationInfoModal';
import { SpawnInputBar } from '@/features/spawn-input/SpawnInputBar';
import { SavedEntitiesModal } from '@/features/saved-entities/SavedEntitiesModal';
import { EntityExplorerPanel } from '@/features/app/components/EntityExplorer/EntityExplorerPanel';
import { TopButtonRow } from '@/features/app/components/TopButtonRow';
import { WorldView } from '@/features/app/components/WorldView/WorldView';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { useEffect, useState, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDepthMapLogic } from '@/features/app/components/TopButtonRow/useDepthMapLogic';
import { getDepthMapForMedia, clearMediaCache } from '@/services/mediaService';
import type { DisplayMode } from '@/features/app/components/TopButtonRow/TopButtonRow';
import styles from './App.module.css';

export function App() {
  const [isSavedEntitiesModalOpen, setIsSavedEntitiesModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    return (localStorage.getItem('displayMode') as DisplayMode) || 'full';
  });
  const [hasDepthMap, setHasDepthMap] = useState(false);
  
  // Global keyboard shortcuts (1 = spawn input, 2 = entity explorer)
  useKeyboardShortcuts();
  
  // Depth map generation logic
  const { generateDepthMap, isGenerating: depthMapGenerating } = useDepthMapLogic();
  
  // Initialize theme on mount
  const { theme } = useThemeStore();
  
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
    // Apply initial theme
    const resolvedTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme]);

  // Initialize worlds and characters from backend, then auto-load pinned entities
  useEffect(() => {
    const initializeData = async () => {
      // Initialize worlds
      const initializeWorldsFromBackend = useLocationsStore.getState().initializeFromBackend;
      await initializeWorldsFromBackend();
      
      // Initialize characters
      const initializeCharactersFromBackend = useCharactersStore.getState().initializeFromBackend;
      await initializeCharactersFromBackend();
      
      // After data is loaded, get pinned entities
      const pinnedCharacters = useCharactersStore.getState().getPinnedCharacters();
      const pinnedLocations = useLocationsStore.getState().getPinnedNodes();
      const nodes = useLocationsStore.getState().nodes;
      
      // STEP 1: Collect ALL media IDs for bulk loading
      const allMediaIds = collectMediaIds({
        characters: pinnedCharacters,
        nodes: nodes
      });
      
      // STEP 2: Bulk load all media in a single request
      const loadMediaBulk = useMediaCacheStore.getState().loadMediaBulk;
      await loadMediaBulk(allMediaIds);
      
      // STEP 3: Now load entities using SYNC cache lookups (no async!)
      const getMediaUrl = useMediaCacheStore.getState().getMediaUrl;
      
      let lastLoadedId: string | null = null;
    
      // Load all pinned characters
      pinnedCharacters.forEach((character) => {
        const seed = {
          name: character.name,
          personality: character.details.personality || 'Unknown personality'
        };
        
        createEntity(character.id, seed, 'character');
        
        // SYNC lookup from cache - no async!
        const imageUrl = getMediaUrl(character.primaryMedia);
        if (imageUrl) {
          updateEntityImage(character.id, imageUrl);
        }
        
        updateEntityProfile(character.id, character.details as any);
        lastLoadedId = character.id;
      });
    
      // Load all pinned location nodes
      const getCascadedDNA = useLocationsStore.getState().getCascadedDNA;
      const getWorldTree = useLocationsStore.getState().getWorldTree;
      const getNode = useLocationsStore.getState().getNode;
    
      pinnedLocations.forEach((node) => {
        // Get cascaded DNA for this node
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
        
        // SYNC lookup from cache - no async!
        const imageUrl = getMediaUrl(node.primaryMedia);
        if (imageUrl) {
          updateEntityImage(node.id, imageUrl);
        }
        
        updateEntityProfile(node.id, cascadedDNA as any);
        lastLoadedId = node.id;
        
        // If this is a host node, also load all its children using centralized utilities
        if (node.type === 'host') {
          const worldTree = getWorldTree(node.id);
          
          if (worldTree) {
            // Get all node IDs in tree (excluding root which we already loaded)
            const allNodeIds = collectAllNodeIds(worldTree);
            const childNodeIds = allNodeIds.slice(1); // Skip first ID (root)
            
            // Create entity sessions for all child nodes using centralized utility
            createEntitySessionsForNodes(
              childNodeIds,
              { createEntity, updateEntityImage, updateEntityProfile }
            );
          }
        }
      });
    
      // Set the last loaded entity as active, preferring saved state
      const savedActiveId = localStorage.getItem('lastActiveEntityId');
      if (savedActiveId && useStore.getState().entities.get(savedActiveId)) {
          setActiveEntity(savedActiveId);
      } else if (lastLoadedId) {
        setActiveEntity(lastLoadedId);
      }
    };
    
    initializeData();
  }, []); // Only run on mount

  // Handlers for TopButtonRow
  const handleOpenInfo = () => {
    setIsInfoModalOpen(true);
  };

  const handleCloseInfo = () => {
    setIsInfoModalOpen(false);
  };

  const handleOpenChat = () => {
    if (activeEntity) {
      openEntityPanel(activeEntity);
    }
  };

  const handleGenerateDepthMap = async () => {
    if (!activeEntity) return;
    
    // Get primaryMedia from either character or location
    let primaryMediaId: string | null = null;
    
    if (isCharacter) {
      const character = useCharactersStore.getState().getCharacter(activeEntity);
      primaryMediaId = character?.primaryMedia || null;
    } else {
      const node = useLocationsStore.getState().getNode(activeEntity);
      primaryMediaId = node?.primaryMedia || null;
    }
    
    if (!primaryMediaId) {
      console.warn('No primary media found for entity:', activeEntity);
      return;
    }
    
    await generateDepthMap(activeEntity, primaryMediaId);
    
    // Notify WorldView to check for the new depth map
    window.dispatchEvent(new CustomEvent('depthMapGenerated'));
    
    // Mark that we have a depth map
    setHasDepthMap(true);
    
    // Switch to 3D mode after depth map generation completes
    setDisplayMode('full');
    localStorage.setItem('displayMode', 'full');
    window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: 'full' } }));
  };

  // Handle display mode change
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    localStorage.setItem('displayMode', mode);
    // Notify WorldView of display mode change
    window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode } }));
  };

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

  // Check for existing depth map when active entity changes
  useEffect(() => {
    const checkDepthMap = async () => {
      const primaryMediaId = getPrimaryMediaId();
      if (!primaryMediaId) {
        setHasDepthMap(false);
        // Switch to 2D mode when no depth map
        if (displayMode !== '2d') {
          setDisplayMode('2d');
          localStorage.setItem('displayMode', '2d');
          window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: '2d' } }));
        }
        return;
      }
      
      // Clear cache to get fresh data
      clearMediaCache();
      
      const depthMap = await getDepthMapForMedia(primaryMediaId);
      const hasDepth = !!depthMap;
      setHasDepthMap(hasDepth);
      
      // Switch to 2D mode when no depth map exists
      if (!hasDepth && displayMode !== '2d') {
        setDisplayMode('2d');
        localStorage.setItem('displayMode', '2d');
        window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: '2d' } }));
      }
      
      // Switch to 3D mode when depth map exists and currently in 2D (keep SBS if already in SBS)
      if (hasDepth && displayMode === '2d') {
        setDisplayMode('full');
        localStorage.setItem('displayMode', 'full');
        window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: 'full' } }));
      }
    };
    
    checkDepthMap();
  }, [activeEntity, getPrimaryMediaId, displayMode]);

  const depthMapDisabled = !activeEntity || !getPrimaryMediaId();

  return (
    <div className={styles.container}>
      
      {/* Fullscreen World View (Background) */}
      <WorldView />
      
      {/* Focus mode hint */}
      {focusModeEnabled && (
        <div className={styles.focusModeHint}>
          Press spacebar to display UI
        </div>
      )}
      
      {/* UI Elements - Hidden in focus mode with CSS (press Space to toggle) */}
      <>
        {/* Top Button Row - Toggle, Info, Chat */}
        <div className={focusModeEnabled ? styles.uiHidden : ''}>
          <TopButtonRow
            onToggleSidebar={toggleEntityExplorerPanel}
            onOpenInfo={handleOpenInfo}
            onOpenChat={handleOpenChat}
            onGenerateDepthMap={handleGenerateDepthMap}
            onDisplayModeChange={handleDisplayModeChange}
            isCharacter={isCharacter}
            infoDisabled={!deepProfile}
            chatDisabled={!deepProfile}
            depthMapDisabled={depthMapDisabled}
            depthMapGenerating={depthMapGenerating}
            displayMode={displayMode}
            hasDepthMap={hasDepthMap}
          />
        </div>
        
        {/* Spawn Input Bar - Bottom Center (Fixed Position) */}
        <div className={`${styles.spawnInputContainer} ${focusModeEnabled ? styles.uiHidden : ''}`}>
          <SpawnInputBar onOpenSavedEntities={() => setIsSavedEntitiesModalOpen(true)} />
        </div>

        {/* Entity Explorer Panel - Draggable */}
        {entityExplorerPanelOpen && (
          <div className={focusModeEnabled ? styles.uiHidden : ''}>
            <EntityExplorerPanel onClose={toggleEntityExplorerPanel} />
          </div>
        )}
        
        {/* Column 2 - Chat History (Collapsible) / Image Prompt Panel */}
        {activeEntitySession && (
          <aside className={`${styles.historyPanel} ${focusModeEnabled ? styles.uiHidden : ''}`}>
            {/* Show Chat History for Characters */}
            {activeEntitySession.entityType !== 'location' && (
              <ChatHistoryViewer messages={activeEntitySession.messages} />
            )}

            {/* Always show image prompt panel */}
            {activeEntitySession.imagePrompt && (
              <ImagePromptPanel imagePrompt={activeEntitySession.imagePrompt} />
            )}
          </aside>
        )}

        {/* Draggable Chat Panels */}
        {Array.from(entities.entries()).map(([entityId, entity]) => {
          const isPanelOpen = entityPanelOpen.get(entityId);
          if (!isPanelOpen || entity.entityType !== 'character') return null;
          
          return (
            <div key={entityId} className={focusModeEnabled ? styles.uiHidden : ''}>
              <ChatPanel
                entityId={entityId}
                entityName={entity.entityName}
                onClose={() => closeEntityPanel(entityId)}
              />
            </div>
          );
        })}
      </>

      {/* Character Info Modal */}
      {isCharacter && (
        <CharacterInfoModal 
          deepProfile={deepProfile as any}
          characterName={activeEntitySession?.entityName || 'Unknown'}
          isOpen={isInfoModalOpen}
          onClose={handleCloseInfo}
        />
      )}

      {/* Location Info Modal */}
      {!isCharacter && activeEntitySession && (
        <LocationInfoModal
          locationProfile={deepProfile as any}
          locationName={activeEntitySession?.entityName || 'Unknown'}
          locationId={activeEntity || undefined}
          isOpen={isInfoModalOpen}
          onClose={handleCloseInfo}
        />
      )}

      {/* Saved Entities Modal - Rendered at App level for proper centering */}
      <SavedEntitiesModal 
        isOpen={isSavedEntitiesModalOpen}
        onClose={() => setIsSavedEntitiesModalOpen(false)}
        initialTab="characters"
      />
    </div>
  );
}
