import { useStore } from '@/store';
import { useThemeStore } from '@/store/slices/themeSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { CharacterPanel } from '@/features/entity-panel/components/CharacterPanel';
import { LocationPanel } from '@/features/entity-panel/components/LocationPanel';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { ImagePromptPanel } from '@/features/chat/components/ImagePromptPanel';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { SpawnInputBar } from '@/features/spawn-input/SpawnInputBar';
import { SavedEntitiesModal } from '@/features/saved-entities/SavedEntitiesModal';
import { EntityExplorerPanel } from '@/features/app/components/EntityExplorer/EntityExplorerPanel';
import { EntityExplorerToggle } from '@/features/app/components/EntityExplorerToggle';
import { Card, ThemeToggle, Button } from '@/components/ui';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { useEffect, useState } from 'react';
import styles from './App.module.css';

export function App() {
  const [isSavedEntitiesModalOpen, setIsSavedEntitiesModalOpen] = useState(false);
  const [savedEntitiesInitialTab, setSavedEntitiesInitialTab] = useState<'characters' | 'locations'>('characters');
  
  // Initialize theme on mount
  const { setTheme, theme } = useThemeStore();
  
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const createEntity = useStore(state => state.createEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);
  const entityPanelOpen = useStore(state => state.entityPanelOpen);
  const closeEntityPanel = useStore(state => state.closeEntityPanel);
  const entityExplorerPanelOpen = useStore(state => state.entityExplorerPanelOpen);
  const toggleEntityExplorerPanel = useStore(state => state.toggleEntityExplorerPanel);
  
  // Get active entity session
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;

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

  return (
    <div className={styles.container}>
      
      {/* Entity Explorer Toggle Button - Top Left */}
      <EntityExplorerToggle onClick={toggleEntityExplorerPanel} />
      
      {/* Spawn Input Bar - Bottom Center (Fixed Position) */}
      <div className={styles.spawnInputContainer}>
        <SpawnInputBar onOpenSavedEntities={() => setIsSavedEntitiesModalOpen(true)} />
      </div>
      
      {/* Theme Toggle - Bottom Right Corner */}
      <div className={styles.themeToggleContainer}>
        <ThemeToggle className="compact" />
      </div>

      {/* Entity Explorer Panel - Draggable */}
      {entityExplorerPanelOpen && (
        <EntityExplorerPanel onClose={toggleEntityExplorerPanel} />
      )}
      
      {/* Column 1 - Entity Panel (Character or Location) */}
      {activeEntitySession && (
        <section className={styles.entitySection}>
          <Card>
            {activeEntitySession.entityType === 'character' ? (
              <CharacterPanel />
            ) : (
              <LocationPanel />
            )}
          </Card>
        </section>
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

      {/* Saved Entities Modal - Rendered at App level for proper centering */}
      <SavedEntitiesModal 
        isOpen={isSavedEntitiesModalOpen}
        onClose={() => setIsSavedEntitiesModalOpen(false)}
        initialTab={savedEntitiesInitialTab}
      />
    </div>
  );
}
