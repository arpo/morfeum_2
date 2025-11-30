import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { useMediaCacheStore, collectMediaIds } from '@/store/slices/mediaCacheSlice';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { WorldView } from '../WorldView/WorldView';
import styles from './ExternalView.module.css';

// BroadcastChannel for receiving updates from main window
const externalViewChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('morfeum-external-view') 
  : null;

/**
 * External View - WorldView only, no UI
 * Used for external display/3D monitor
 * 
 * Initializes stores from backend/localStorage to sync with main window
 */
export function ExternalView() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const initializeStores = async () => {
      // Initialize stores from backend (same as main App)
      const initializeWorldsFromBackend = useLocationsStore.getState().initializeFromBackend;
      await initializeWorldsFromBackend();
      
      const initializeCharactersFromBackend = useCharactersStore.getState().initializeFromBackend;
      await initializeCharactersFromBackend();
      
      // Get pinned entities and load their media
      const pinnedCharacters = useCharactersStore.getState().getPinnedCharacters();
      const pinnedLocations = useLocationsStore.getState().getPinnedNodes();
      const nodes = useLocationsStore.getState().nodes;
      
      const allMediaIds = collectMediaIds({
        characters: pinnedCharacters,
        nodes: nodes
      });
      
      const loadMediaBulk = useMediaCacheStore.getState().loadMediaBulk;
      await loadMediaBulk(allMediaIds);
      
      // Create entity sessions for pinned entities
      const createEntity = useStore.getState().createEntity;
      const updateEntityImage = useStore.getState().updateEntityImage;
      const updateEntityProfile = useStore.getState().updateEntityProfile;
      const getMediaUrl = useMediaCacheStore.getState().getMediaUrl;
      const getCascadedDNA = useLocationsStore.getState().getCascadedDNA;
      
      let lastLoadedId: string | null = null;
      
      // Load pinned characters
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
      
      // Load pinned locations AND their world tree children
      const getWorldTree = useLocationsStore.getState().getWorldTree;
      
      pinnedLocations.forEach((node) => {
        const cascadedDNA = getCascadedDNA(node.id);
        
        if (!cascadedDNA.world) {
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
        
        // If this is a host node, also load all its children (same as App.tsx)
        if (node.type === 'host') {
          const worldTree = getWorldTree(node.id);
          
          if (worldTree) {
            // Get all node IDs in tree (excluding root which we already loaded)
            const allNodeIds = collectAllNodeIds(worldTree);
            const childNodeIds = allNodeIds.slice(1); // Skip first ID (root)
            
            // Create entity sessions for all child nodes
            createEntitySessionsForNodes(
              childNodeIds,
              { createEntity, updateEntityImage, updateEntityProfile }
            );
          }
        }
      });
      
      // Set active entity from localStorage or last loaded
      const savedActiveId = localStorage.getItem('lastActiveEntityId');
      const setActiveEntity = useStore.getState().setActiveEntity;
      
      if (savedActiveId && useStore.getState().entities.get(savedActiveId)) {
        setActiveEntity(savedActiveId);
      } else if (lastLoadedId) {
        setActiveEntity(lastLoadedId);
      }
      
      // Apply saved display mode
      const savedDisplayMode = localStorage.getItem('displayMode') || '2d';
      window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: savedDisplayMode } }));
      
      setIsInitialized(true);
    };
    
    initializeStores();
  }, []);

  // Listen for broadcasts from main window
  useEffect(() => {
    if (!externalViewChannel) return;
    
    const handleMessage = (event: MessageEvent) => {
      const { type, mode, entityId, imageUrl } = event.data;
      
      if (type === 'displayModeChanged' && mode) {
        // Update display mode in this window
        window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode } }));
      }
      
      if (type === 'entityChanged' && entityId) {
        // Update active entity and trigger image reload
        const setActiveEntity = useStore.getState().setActiveEntity;
        const updateEntityImage = useStore.getState().updateEntityImage;
        
        // Ensure entity exists in our store, if not we need to reload
        if (!useStore.getState().entities.get(entityId)) {
          // Entity doesn't exist, reload page to get fresh data
          window.location.reload();
          return;
        }
        
        // Update image if provided
        if (imageUrl) {
          updateEntityImage(entityId, imageUrl);
        }
        
        // Set as active
        setActiveEntity(entityId);
      }
    };
    
    externalViewChannel.addEventListener('message', handleMessage);
    return () => externalViewChannel.removeEventListener('message', handleMessage);
  }, []);

  // Show loading or black screen until initialized
  if (!isInitialized) {
    return (
      <div className={styles.container} data-component="external-view">
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-component="external-view">
      <WorldView />
    </div>
  );
}
