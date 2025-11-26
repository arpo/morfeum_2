import { useStore } from '@/store';
import { useThemeStore } from '@/store/slices/themeSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { ImagePromptPanel } from '@/features/chat/components/ImagePromptPanel';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { CharacterInfoModal } from '@/features/chat/components/CharacterInfoModal';
import { LocationInfoModal } from '@/features/chat/components/LocationInfoModal';
import { SpawnInputBar } from '@/features/spawn-input/SpawnInputBar';
import { SavedEntitiesModal } from '@/features/saved-entities/SavedEntitiesModal';
import { EntityExplorerPanel } from '@/features/app/components/EntityExplorer/EntityExplorerPanel';
import { TopButtonRow } from '@/features/app/components/TopButtonRow';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { useEffect, useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import styles from './App.module.css';

export function App() {
  const [isSavedEntitiesModalOpen, setIsSavedEntitiesModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Global keyboard shortcuts (1 = spawn input, 2 = entity explorer)
  useKeyboardShortcuts();
  
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
  const entityImage = activeEntitySession?.entityImage || null;
  const deepProfile = activeEntitySession?.deepProfile || null;
  const isCharacter = activeEntitySession?.entityType === 'character';

  // Reset loading state when image URL changes
  useEffect(() => {
    if (entityImage) {
      setImageLoading(true);
    } else {
      setImageLoading(true);
    }
  }, [entityImage]);

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
      
      // After data is loaded, auto-load pinned entities
      const pinnedCharacters = useCharactersStore.getState().getPinnedCharacters();
      const pinnedLocations = useLocationsStore.getState().getPinnedNodes();
    
    let lastLoadedId: string | null = null;
    
    // Load all pinned characters
    pinnedCharacters.forEach((character) => {
      const seed = {
        name: character.name,
        personality: character.details.personality || 'Unknown personality'
      };
      
      createEntity(character.id, seed, 'character');
      
      if (character.imagePath) {
        updateEntityImage(character.id, character.imagePath);
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
      
      if (node.imagePath) {
        updateEntityImage(node.id, node.imagePath);
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

  return (
    <div className={styles.container}>
      
      {/* Fullscreen Entity Background Image */}
      {activeEntitySession && (
        <div className={styles.entityBackground}>
          {(!entityImage || imageLoading) && (
            <div className={styles.backgroundSkeleton}>
              <div className={styles.skeletonBreathing} />
            </div>
          )}
          {entityImage && (
            <img 
              src={entityImage} 
              alt={activeEntitySession.entityName || 'Entity'}
              className={styles.entityBackgroundImage}
              onLoad={() => setImageLoading(false)}
              style={{ opacity: imageLoading ? 0 : 1, transition: 'opacity 0.3s ease-in' }}
            />
          )}
        </div>
      )}
      
      {/* Focus mode hint */}
      {focusModeEnabled && (
        <div className={styles.focusModeHint}>
          Press spacebar to display UI
        </div>
      )}
      
      {/* UI Elements - Hidden in focus mode (press Space to toggle) */}
      {!focusModeEnabled && (
        <>
          {/* Top Button Row - Toggle, Info, Chat */}
          <TopButtonRow
            onToggleSidebar={toggleEntityExplorerPanel}
            onOpenInfo={handleOpenInfo}
            onOpenChat={handleOpenChat}
            isCharacter={isCharacter}
            infoDisabled={!deepProfile}
            chatDisabled={!deepProfile}
          />
          
          {/* Spawn Input Bar - Bottom Center (Fixed Position) */}
          <div className={styles.spawnInputContainer}>
            <SpawnInputBar onOpenSavedEntities={() => setIsSavedEntitiesModalOpen(true)} />
          </div>

          {/* Entity Explorer Panel - Draggable */}
          {entityExplorerPanelOpen && (
            <EntityExplorerPanel onClose={toggleEntityExplorerPanel} />
          )}
          
          {/* Column 2 - Chat History (Collapsible) / Image Prompt Panel */}
          {activeEntitySession && (
            <aside className={styles.historyPanel}>
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
              <ChatPanel
                key={entityId}
                entityId={entityId}
                entityName={entity.entityName}
                onClose={() => closeEntityPanel(entityId)}
              />
            );
          })}
        </>
      )}

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
