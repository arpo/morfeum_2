import { useStore } from '@/store';
import { useThemeStore } from '@/store/slices/themeSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { CharacterPanel } from '@/features/entity-panel/components/CharacterPanel';
import { LocationPanel } from '@/features/entity-panel/components/LocationPanel';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { ImagePromptPanel } from '@/features/chat/components/ImagePromptPanel';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { SpawnInputBar } from '@/features/spawn-input/SpawnInputBar';
import { ActiveSpawnsPanel } from '@/features/spawn-panel/ActiveSpawnsPanel';
import { ChatTabs } from '@/features/chat-tabs/ChatTabs';
import { Card, ThemeToggle } from '@/components/ui';
import { useSpawnEvents } from '@/hooks/useSpawnEvents';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { useEffect } from 'react';
import styles from './App.module.css';

export function App() {
  // Initialize SSE connection for spawn events
  useSpawnEvents();
  
  // Initialize theme on mount
  const { setTheme, theme } = useThemeStore();
  
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const createEntity = useStore(state => state.createEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);
  const chatPanelOpen = useStore(state => state.chatPanelOpen);
  const closeChatPanel = useStore(state => state.closeChatPanel);
  
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

  // Auto-load pinned entities on mount
  useEffect(() => {
    // Get pinned entities
    const pinnedCharacters = useCharactersStore.getState().getPinnedCharacters();
    const pinnedLocations = useLocationsStore.getState().getPinnedNodes();
    
    // console.log('[App] Auto-loading pinned entities...');
    let lastLoadedId: string | null = null;
    
    // Load all pinned characters
    pinnedCharacters.forEach((character) => {
      // console.log('[App] Auto-loading pinned character:', character.id);
      
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
      // console.log('[App] Auto-loading pinned node:', node.id);
      
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
      
      // If this is a host node, also load all its children using centralized utility
      if (node.type === 'host') {
        const worldTree = getWorldTree(node.id);
        
        if (worldTree) {
          // Get all node IDs in tree (excluding root which we already loaded)
          const allNodeIds = collectAllNodeIds(worldTree);
          const childNodeIds = allNodeIds.slice(1); // Skip first ID (root)
          
          // Create entity sessions for all child nodes
          childNodeIds.forEach((childId) => {
            const childNode = getNode(childId);
            if (childNode) {
              const childCascadedDNA = getCascadedDNA(childId);
              const childSeed = {
                name: childNode.name,
                atmosphere: childCascadedDNA.world?.semantic?.atmosphere || 'Unknown'
              };
              
              createEntity(childId, childSeed, 'location');
              
              if (childNode.imagePath) {
                updateEntityImage(childId, childNode.imagePath);
              }
              
              updateEntityProfile(childId, childCascadedDNA as any);
            }
          });
        }
      }
    });
    
    // Set the last loaded entity as active
    if (lastLoadedId) {
      setActiveEntity(lastLoadedId);
    }
    
    // console.log(`[App] Auto-loaded ${pinnedCharacters.length} characters and ${pinnedLocations.length} locations`);
  }, []); // Only run on mount

  return (
    <div className={styles.container}>
      
      {/* Column 1 - Left Sidebar (Controls) */}
      <aside className={styles.sidebar}>
        <SpawnInputBar />
        <ActiveSpawnsPanel />
        <ChatTabs />
      </aside>
      
      {/* Theme Toggle - Bottom Right Corner */}
      <div className={styles.themeToggleContainer}>
        <ThemeToggle className="compact" />
      </div>
      
      {/* Column 2 - Entity Panel (Character or Location) */}
      {activeEntitySession && (
        <section className={styles.chatSection}>
          <Card>
            {activeEntitySession.entityType === 'character' ? (
              <CharacterPanel />
            ) : (
              <LocationPanel />
            )}
          </Card>
        </section>
      )}
      
      {/* Column 3 - Chat History (Collapsible) / Image Prompt Panel */}
      {activeEntitySession && (
        <aside className={styles.historyPanel}>
          {/* Hide chat history for locations */}
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
        const isPanelOpen = chatPanelOpen.get(entityId);
        if (!isPanelOpen || entity.entityType !== 'character') return null;
        
        return (
          <ChatPanel
            key={entityId}
            entityId={entityId}
            entityName={entity.entityName}
            onClose={() => closeChatPanel(entityId)}
          />
        );
      })}
    </div>
  );
}
