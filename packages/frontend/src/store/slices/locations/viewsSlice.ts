/**
 * Views Slice - View management
 * Manages multiple views per node for different perspectives
 */

import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { View } from './types';

export interface ViewsSlice {
  views: Record<string, View>;
  
  // View CRUD operations
  createView: (view: Omit<View, 'id'> & { id?: string }) => string;
  getView: (id: string) => View | undefined;
  getNodeViews: (nodeId: string) => View[];
  deleteView: (id: string) => void;
  getAllViews: () => View[];
}

export const createViewsSlice: StateCreator<
  ViewsSlice,
  [],
  [],
  ViewsSlice
> = (set, get) => ({
  views: {},
  
  createView: (view) => {
    const id = view.id || uuidv4();
    const newView: View = {
      ...view,
      id,
    };
    
    set((state) => ({
      views: {
        ...state.views,
        [id]: newView,
      },
    }));
    
    return id;
  },
  
  getView: (id) => {
    return get().views[id];
  },
  
  getNodeViews: (nodeId) => {
    const allViews = get().views;
    return Object.values(allViews).filter(view => view.nodeId === nodeId);
  },
  
  deleteView: (id) => {
    set((state) => {
      const { [id]: deleted, ...rest } = state.views;
      return { views: rest };
    });
  },
  
  getAllViews: () => {
    return Object.values(get().views);
  },
});
