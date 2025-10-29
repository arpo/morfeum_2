/**
 * UI Slice - UI state management
 * Manages pins, focus state, and other UI-related state
 */

import { StateCreator } from 'zustand';
import { FocusState, Node } from './types';
import { NodesSlice } from './nodesSlice';

export interface UISlice {
  pinnedIds: string[];
  
  // Pin operations
  togglePinned: (id: string) => void;
  isPinned: (id: string) => boolean;
  getPinnedNodes: () => Node[];
  
  // Focus management
  updateNodeFocus: (nodeId: string, focus: FocusState) => void;
  getNodeFocus: (nodeId: string) => FocusState | undefined;
  ensureFocusInitialized: (nodeId: string) => void;
  
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
  
  updateNodeFocus: (nodeId, focus) => {
    get().updateNode(nodeId, { focus });
  },
  
  getNodeFocus: (nodeId) => {
    const node = get().getNode(nodeId);
    return node?.focus;
  },
  
  ensureFocusInitialized: (nodeId) => {
    const node = get().getNode(nodeId);
    if (!node || node.focus) return;
    
    // Use default focus values
    const defaultFocus: FocusState = {
      node_id: node.name,
      perspective: 'exterior',
      viewpoint: 'default view',
      distance: 'medium',
    };
    
    get().updateNode(nodeId, { focus: defaultFocus });
  },
  
  clearAll: () => {
    set({ nodes: {}, views: {}, worldTrees: [], pinnedIds: [] } as any);
  },
});
