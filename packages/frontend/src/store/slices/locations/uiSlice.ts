/**
 * UI Slice - UI state management
 * Manages pins and other UI-related state
 */

import { StateCreator } from 'zustand';
import { Node } from './types';
import { NodesSlice } from './nodesSlice';

export interface UISlice {
  pinnedIds: string[];
  expandedNodeIds: string[];
  
  // Pin operations
  togglePinned: (id: string) => void;
  isPinned: (id: string) => boolean;
  getPinnedNodes: () => Node[];
  
  // Expansion operations
  expandNode: (id: string) => void;
  collapseNode: (id: string) => void;
  setExpandedNodes: (ids: string[]) => void;
  isExpanded: (id: string) => boolean;
  
  // Bulk operations
  clearAll: () => void;
}

export const createUISlice: StateCreator<
  UISlice & NodesSlice,
  [],
  [],
  UISlice
> = (set, get) => ({
  pinnedIds: [],
  expandedNodeIds: [],
  
  togglePinned: (id) => {
    const node = get().getNode(id);
    if (!node) return;
    
    set((state) => {
      const pinnedIds = [...state.pinnedIds];
      const index = pinnedIds.indexOf(id);
      
      if (index > -1) {
        pinnedIds.splice(index, 1);
      } else {
        pinnedIds.push(id);
      }
      
      return { pinnedIds };
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  },
  
  isPinned: (id) => {
    return get().pinnedIds.includes(id);
  },
  
  getPinnedNodes: () => {
    const pinnedIds = get().pinnedIds;
    return pinnedIds
      .map(id => get().getNode(id))
      .filter(Boolean) as Node[];
  },
  
  expandNode: (id) => {
    set((state) => {
      if (!state.expandedNodeIds.includes(id)) {
        return { expandedNodeIds: [...state.expandedNodeIds, id] };
      }
      return state;
    });
  },
  
  collapseNode: (id) => {
    set((state) => ({
      expandedNodeIds: state.expandedNodeIds.filter(nodeId => nodeId !== id)
    }));
  },
  
  setExpandedNodes: (ids) => {
    set({ expandedNodeIds: ids });
  },
  
  isExpanded: (id) => {
    return get().expandedNodeIds.includes(id);
  },
  
  clearAll: () => {
    set({ nodes: {}, views: {}, worldTrees: [], pinnedIds: [], expandedNodeIds: [] } as any);
  },
});
