/**
 * Nodes Slice - Node CRUD operations
 * Manages the flat storage of all location nodes
 */

import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Node } from './types';

export interface NodesSlice {
  nodes: Record<string, Node>;
  
  // Node CRUD operations
  createNode: (node: Omit<Node, 'id'> & { id?: string }) => string;
  getNode: (id: string) => Node | undefined;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  getAllNodes: () => Node[];
}

export const createNodesSlice: StateCreator<
  NodesSlice,
  [],
  [],
  NodesSlice
> = (set, get) => ({
  nodes: {},
  
  createNode: (node) => {
    const id = node.id || uuidv4();
    const newNode: Node = {
      ...node,
      id,
    };
    
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: newNode,
      },
    }));
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
    
    return id;
  },
  
  getNode: (id) => {
    return get().nodes[id];
  },
  
  updateNode: (id, updates) => {
    set((state) => {
      const existing = state.nodes[id];
      if (!existing) return state;
      
      return {
        nodes: {
          ...state.nodes,
          [id]: {
            ...existing,
            ...updates,
          },
        },
      };
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  },
  
  deleteNode: (id) => {
    set((state) => {
      const { [id]: deleted, ...rest } = state.nodes;
      return { nodes: rest };
    });
    
    // Save to backend after state update
    (get() as any).saveToBackend?.();
  },
  
  getAllNodes: () => {
    return Object.values(get().nodes);
  },
});
