import { useState, useCallback, useMemo } from 'react';
import { useLocationsStore, Node } from '@/store/slices/locations';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useStore } from '@/store';
import { findTreeContainingNode, collectAllNodeIds, findFirstImageInTree } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { getPrimaryMediaUrl } from '@/services/mediaService';
import type { SavedEntitiesLogicReturn, EntityTab } from './types';
import type { Character } from '@/store/slices/charactersSlice';

export function useSavedEntitiesLogic(onClose: () => void, initialTab: EntityTab = 'characters'): SavedEntitiesLogicReturn {
  const [activeTab, setActiveTab] = useState<EntityTab>(initialTab);
  
  // Locations (filter to world nodes only)
  const nodesMap = useLocationsStore(state => state.nodes);
  const getNode = useLocationsStore(state => state.getNode);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  
  // Compute locations with thumbnail images
  const locations = useMemo(() => {
    const hostNodes = Object.values(nodesMap).filter(node => node.type === 'host');
    
    // Add computed thumbnail image for each location
    return hostNodes.map(node => {
      const foundImage = findFirstImageInTree(node.id, getNode, worldTrees);
      
      return {
        ...node,
        // Set primaryMedia if we found a media ID, otherwise keep existing
        primaryMedia: foundImage || node.primaryMedia,
      } as Node;
    });
  }, [nodesMap, getNode, worldTrees]);

  const pinnedLocationIds = useLocationsStore(state => state.pinnedIds);
  const deleteWorldTree = useLocationsStore(state => state.deleteWorldTree);
  const getWorldNodeCount = useLocationsStore(state => state.getWorldNodeCount);
  const togglePinnedLocation = useLocationsStore(state => state.togglePinned);
  const isLocationPinned = useLocationsStore(state => state.isPinned);
  const getCascadedDNA = useLocationsStore(state => state.getCascadedDNA);
  
  // Characters
  const charactersMap = useCharactersStore(state => state.characters);
  const characters = useMemo(() => Object.values(charactersMap), [charactersMap]);
  const pinnedCharacterIds = useCharactersStore(state => state.pinnedIds);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);
  const togglePinnedCharacter = useCharactersStore(state => state.togglePinned);
  const isCharacterPinned = useCharactersStore(state => state.isPinned);
  
  // Entity management
  const createEntity = useStore(state => state.createEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);

  const handleLoadLocation = useCallback((node: Node) => {
    // Get cascaded DNA for this node
    const cascadedDNA = getCascadedDNA(node.id);
    
    if (!cascadedDNA.world) {
      console.error('[SavedEntitiesModal] Cannot load node without world DNA.');
      // Still try to load if possible?
      // Backend now ensures DNA is there.
    }
    
    // Find the world tree containing this node using centralized utility
    const worldTrees = useLocationsStore.getState().worldTrees;
    
    // For Host node, it IS the tree (root) usually
    let worldTree = findTreeContainingNode(worldTrees, node.id);
    
    // Fallback: if node is host, find by ID
    if (!worldTree && node.type === 'host') {
       worldTree = worldTrees.find(t => t.id === node.id) || undefined;
    }
    
    if (!worldTree) {
      console.error('[SavedEntitiesModal] Could not find world tree for node:', node.id);
      return;
    }
    
    // Collect all node IDs in the tree
    const allNodeIds = collectAllNodeIds(worldTree);
    
    // Create entity sessions for ALL nodes
    createEntitySessionsForNodes(
      allNodeIds,
      { createEntity, updateEntityImage, updateEntityProfile }
    );
    
    // Set clicked node as active entity
    setActiveEntity(node.id);
    
    // Close modal
    setTimeout(() => {
      onClose();
    }, 50);
  }, [createEntity, updateEntityImage, updateEntityProfile, setActiveEntity, onClose, getCascadedDNA]);

  const handleLoadCharacter = useCallback((character: Character) => {
    const seed = {
      name: character.name,
      personality: character.details.personality || 'Unknown personality'
    };
    
    createEntity(character.id, seed, 'character');
    
    // Resolve via media system (handles primaryMedia)
    getPrimaryMediaUrl(character).then(url => {
      if (url) {
        updateEntityImage(character.id, url);
      }
    });
    
    updateEntityProfile(character.id, character.details as any);
    setActiveEntity(character.id);
    onClose();
  }, [createEntity, updateEntityImage, updateEntityProfile, setActiveEntity, onClose]);

  const handleDeleteLocation = useCallback((worldId: string) => {
    const nodeCount = getWorldNodeCount(worldId);
    const message = `Delete this world and all ${nodeCount} nodes in it?`;
    
    if (window.confirm(message)) {
      deleteWorldTree(worldId);
    }
  }, [deleteWorldTree, getWorldNodeCount]);

  const handleDeleteCharacter = useCallback((characterId: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      deleteCharacter(characterId);
    }
  }, [deleteCharacter]);

  const handlePinLocation = useCallback((locationId: string) => {
    togglePinnedLocation(locationId);
  }, [togglePinnedLocation]);

  const handlePinCharacter = useCallback((characterId: string) => {
    togglePinnedCharacter(characterId);
  }, [togglePinnedCharacter]);

  const handleCopyWorldInfo = useCallback((node: Node) => {
    const cascadedDNA = getCascadedDNA(node.id);
    const exportData = {
      node,
      cascadedDNA
    };
    
    const nodeJson = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(nodeJson)
      .then(() => alert('Location data copied to clipboard!'))
      .catch((err) => console.error('Failed to copy:', err));
  }, [getCascadedDNA]);

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
    handleCopyWorldInfo,
    getWorldNodeCount
  };
}
