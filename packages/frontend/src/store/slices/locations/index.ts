/**
 * Locations Store - Combined slices
 * Refactored from 875-line monolith into focused slices
 * 
 * Uses backend file storage instead of localStorage for persistence
 */

import { create } from 'zustand';
import { createNodesSlice, NodesSlice } from './nodesSlice';
import { createTreesSlice, TreesSlice } from './treesSlice';
import { createViewsSlice, ViewsSlice } from './viewsSlice';
import { createDNASlice, DNASlice } from './dnaSlice';
import { createUISlice, UISlice } from './uiSlice';
import { createLegacySlice, LegacySlice } from './legacySlice';
import { worldStorageService, WorldsData } from '@/services/worldStorage.service';

// Storage actions
export interface StorageActions {
  saveToBackend: () => Promise<boolean>;
  loadFromBackend: () => Promise<boolean>;
  initializeFromBackend: () => Promise<boolean>;
  clearBackend: () => Promise<boolean>;
}

// Combined store type
export type LocationsState = NodesSlice & 
  TreesSlice & 
  ViewsSlice & 
  DNASlice & 
  UISlice & 
  LegacySlice &
  StorageActions;

// Create the combined store WITHOUT persist middleware
export const useLocationsStore = create<LocationsState>()(
  (...a) => ({
    ...createNodesSlice(...a),
    ...createTreesSlice(...a),
    ...createViewsSlice(...a),
    ...createDNASlice(...a),
    ...createUISlice(...a),
    ...createLegacySlice(...a),
    
    // Storage actions
    saveToBackend: async () => {
      const state = useLocationsStore.getState();
      const data: WorldsData = {
        nodes: state.nodes,
        views: state.views,
        worldTrees: state.worldTrees,
        pinnedIds: state.pinnedIds,
      };
      return await worldStorageService.saveWorlds(data);
    },
    
    loadFromBackend: async () => {
      const data = await worldStorageService.loadWorlds();
      if (data) {
        useLocationsStore.setState({
          nodes: data.nodes,
          views: data.views,
          worldTrees: data.worldTrees,
          pinnedIds: data.pinnedIds,
        });
        return true;
      }
      return false;
    },
    
    initializeFromBackend: async () => {
      // This handles migration automatically
      const data = await worldStorageService.initialize();
      if (data) {
        useLocationsStore.setState({
          nodes: data.nodes,
          views: data.views,
          worldTrees: data.worldTrees,
          pinnedIds: data.pinnedIds,
        });
        return true;
      }
      return false;
    },
    
    clearBackend: async () => {
      const cleared = await worldStorageService.clearWorlds();
      if (cleared) {
        // Also clear local state
        useLocationsStore.setState({
          nodes: {},
          views: {},
          worldTrees: [],
          pinnedIds: []
        });
      }
      return cleared;
    },
  })
);

// Re-export types for convenience
export type {
  Node,
  NodeType,
  TreeNode,
  View,
  FocusState,
  CascadedDNA,
  HostNode,
  RegionNode,
  LocationNode,
  NicheNode,
  Location, // Legacy - deprecated
} from './types';
