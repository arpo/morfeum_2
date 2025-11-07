import { useState, useCallback, useMemo } from 'react';
import { useLocationsStore, Node } from '@/store/slices/locations';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useStore } from '@/store';
import { findTreeContainingNode, collectAllNodeIds, findFirstImageInTree } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import type { SavedEntitiesLogicReturn, EntityTab } from './types';
import type { Character } from '@/store/slices/charactersSlice';

export function useSavedEntitiesLogic(onClose: () => void): SavedEntitiesLogicReturn {
  const [activeTab, setActiveTab] = useState<EntityTab>('characters');
  
  // Locations (filter to world nodes only)
  const nodesMap = useLocationsStore(state => state.nodes);
  const getNode = useLocationsStore(state => state.getNode);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  
  // Compute locations with thumbnail images
  const locations = useMemo(() => {
    const hostNodes = Object.values(nodesMap).filter(node => node.type === 'host');
    
    // Add computed thumbnail image for each location
    return hostNodes.map(node => ({
      ...node,
      imagePath: findFirstImageInTree(node.id, getNode, worldTrees) || node.imagePath
    }));
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
      alert('This location is missing world data. Please regenerate it.');
      return;
    }
    
    // Find the world tree containing this node using centralized utility
    const worldTrees = useLocationsStore.getState().worldTrees;
    
    const worldTree = findTreeContainingNode(worldTrees, node.id);
    
    if (!worldTree) {
      console.error('[SavedEntitiesModal] Could not find world tree for node:', node.id);
      return;
    }
    
    // Collect all node IDs in the tree using centralized utility
    const allNodeIds = collectAllNodeIds(worldTree);
    
    // Create entity sessions for ALL nodes using centralized utility
    createEntitySessionsForNodes(
      allNodeIds,
      { createEntity, updateEntityImage, updateEntityProfile }
    );
    
    // Set clicked node as active entity
    setActiveEntity(node.id);
    
    // Close modal after a brief delay to ensure all entity updates are flushed
    // This fixes a React batching issue where ChatTabs would render before
    // all entity updates were committed to the store
    setTimeout(() => {
      onClose();
    }, 50);
  }, [createEntity, updateEntityImage, updateEntityProfile, setActiveEntity, onClose, getCascadedDNA]);

  const handleLoadCharacter = useCallback((character: Character) => {
    // Create seed data for chat initialization
    const seed = {
      name: character.name,
      personality: character.details.personality || 'Unknown personality'
    };
    
    // Create entity session for this character
    createEntity(character.id, seed, 'character');
    
    // Update entity with image and deep profile
    if (character.imagePath) {
      updateEntityImage(character.id, character.imagePath);
    }
    
    updateEntityProfile(character.id, character.details as any);
    
    // Set as active entity
    setActiveEntity(character.id);
    
    // Close modal
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
  }, [togglePinnedLocation, isLocationPinned]);

  const handlePinCharacter = useCallback((characterId: string) => {
    togglePinnedCharacter(characterId);
  }, [togglePinnedCharacter, isCharacterPinned]);

  const handleCopyWorldInfo = useCallback((node: Node) => {
    // Get cascaded DNA and include it in the export
    const cascadedDNA = getCascadedDNA(node.id);
    const exportData = {
      node,
      cascadedDNA
    };
    
    const nodeJson = JSON.stringify(exportData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(nodeJson)
      .then(() => {
        alert('Location data copied to clipboard!');
      })
      .catch((err) => {
        console.error('[SavedEntitiesModal] Failed to copy node data:', err);
        alert('Failed to copy location data. Please try again.');
      });
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
