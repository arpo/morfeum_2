/**
 * App Initialization Hook
 * Handles data loading and theme setup
 */

import { useEffect } from 'react';
import { useStore } from '@/store';
import { useThemeStore } from '@/store/slices/themeSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { useMediaCacheStore, collectMediaIds } from '@/store/slices/mediaCacheSlice';
import { collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';

export function useAppInitialization() {
  const { theme } = useThemeStore();
  const createEntity = useStore(state => state.createEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);

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
}
