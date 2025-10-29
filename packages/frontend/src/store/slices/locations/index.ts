/**
 * Locations Store - Combined slices
 * Refactored from 875-line monolith into focused slices
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createNodesSlice, NodesSlice } from './nodesSlice';
import { createTreesSlice, TreesSlice } from './treesSlice';
import { createViewsSlice, ViewsSlice } from './viewsSlice';
import { createDNASlice, DNASlice } from './dnaSlice';
import { createUISlice, UISlice } from './uiSlice';
import { createLegacySlice, LegacySlice } from './legacySlice';

// Combined store type
export type LocationsState = NodesSlice & 
  TreesSlice & 
  ViewsSlice & 
  DNASlice & 
  UISlice & 
  LegacySlice;

// Create the combined store
export const useLocationsStore = create<LocationsState>()(
  persist(
    (...a) => ({
      ...createNodesSlice(...a),
      ...createTreesSlice(...a),
      ...createViewsSlice(...a),
      ...createDNASlice(...a),
      ...createUISlice(...a),
      ...createLegacySlice(...a),
    }),
    {
      name: 'morfeum-locations-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        views: state.views,
        worldTrees: state.worldTrees,
        pinnedIds: state.pinnedIds,
      }),
    }
  )
);

// Re-export types for convenience
export type {
  Node,
  NodeType,
  TreeNode,
  View,
  FocusState,
  CascadedDNA,
  WorldNode,
  RegionNode,
  LocationNode,
  SublocationNode,
  Location, // Legacy - deprecated
} from './types';
