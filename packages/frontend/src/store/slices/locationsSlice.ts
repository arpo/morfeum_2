/**
 * Locations Storage Slice - Tree-Based Architecture
 * Two-table system: Nodes (flat) + World Trees (nested)
 * Each node stores only its own DNA layer
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Focus state for tracking current view
export interface FocusState {
  node_id: string;
  perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
  viewpoint: string;
  distance: 'close' | 'medium' | 'far';
}

// Node types
export type NodeType = 'world' | 'region' | 'location' | 'sublocation';

// DNA type definitions (single-layer per node)
export interface WorldNode {
  meta: {
    name: string;
    slug: string;
  };
  semantic: {
    environment: string;
    dominant_materials: string[];
    atmosphere: string;
    architectural_tone: string;
    genre: string;
    mood_baseline: string;
    palette_bias: string[];
    physics: string;
  };
  spatial: {
    orientation: {
      light_behavior: string;
    };
  };
  render: {
    style: string;
    lighting_defaults: string;
    camera_defaults: string;
    seed: string;
  };
  profile: {
    colorsAndLighting: string;
    symbolicThemes: string;
    searchDesc?: string;
  };
}

export interface RegionNode {
  meta: {
    name: string;
    slug: string;
  };
  semantic: {
    environment: string;
    climate: string;
    weather_pattern: string;
    architecture_style: string;
    mood: string;
    palette_shift: string[];
  };
  spatial: {
    orientation: {
      dominant_view_axis: string;
    };
  };
  render: {
    style: string;
    lighting_profile: string;
    seed: string;
  };
  profile: {
    colorsAndLighting: string;
    symbolicThemes: string;
    searchDesc?: string;
  };
}

export interface LocationNode {
  meta: {
    name: string;
    slug: string;
  };
  semantic: {
    environment: string;
    terrain_or_interior: string;
    structures: Array<{
      type: string;
      material: string;
      color: string;
      condition: string;
    }>;
    vegetation: {
      types: string[];
      density: string;
    };
    fauna: {
      types: string[];
      presence: string;
    };
    time_of_day: string;
    lighting: string;
    weather_or_air: string;
    atmosphere: string;
    mood: string;
    color_palette: string[];
    soundscape: string[];
    genre: string;
  };
  spatial: {
    scale: {
      primary_height_m: number | null;
      scene_width_m: number | null;
    };
    placement: {
      key_subject_position: string;
      camera_anchor: string;
    };
    orientation: {
      light_source_direction: string;
      prevailing_wind_or_flow: string;
    };
    connectivity: {
      links_to: string[];
    };
  };
  render: {
    style: string;
    camera: string;
    composition: string;
    lighting_profile: string;
    seed: string;
  };
  profile: {
    looks: string;
    colorsAndLighting: string;
    atmosphere: string;
    materials: string;
    mood: string;
    sounds: string;
    symbolicThemes: string;
    airParticles: string;
    fictional: boolean;
    copyright: boolean;
    searchDesc?: string;
  };
  suggestedDestinations: Array<{
    name: string;
    action: string;
    relation: string;
    slug_hint: string;
  }>;
}

export interface SublocationNode {
  meta: {
    name: string;
    slug?: string;
  };
  semantic: {
    environment: string;
    terrain_or_interior: string;
    structures: Array<{
      type: string;
      material: string;
      color: string;
      condition: string;
    }>;
    vegetation?: {
      types: string[];
      density: string;
    };
    fauna?: {
      types: string[];
      presence: string;
    };
    lighting: string;
    weather_or_air: string;
    atmosphere: string;
    mood: string;
    color_palette: string[];
    soundscape: string[];
  };
  spatial: {
    scale: {
      ceiling_height_m?: number | null;
      room_length_m?: number | null;
      room_width_m?: number | null;
    };
    placement: {
      key_subject_position: string;
      camera_anchor: string;
    };
    orientation: {
      dominant_view_axis: string;
    };
    connectivity: {
      links_to: string[];
    };
  };
  profile: {
    looks: string;
    colorsAndLighting: string;
    atmosphere: string;
    materials: string;
    mood: string;
    sounds: string;
    symbolicThemes: string;
    airParticles: string;
    fictional: boolean;
    copyright: boolean;
    searchDesc?: string;
  };
}

// Node interface - stores single DNA layer only
export interface Node {
  id: string;
  type: NodeType;
  name: string;
  dna: WorldNode | RegionNode | LocationNode | SublocationNode;
  imagePath: string;
  focus?: FocusState;
}

// Tree structure - stores ID references only
export interface TreeNode {
  id: string;
  type: NodeType;
  children: TreeNode[];
}

// Cascaded DNA for generation (collected from tree path)
export interface CascadedDNA {
  world?: WorldNode;
  region?: RegionNode;
  location?: LocationNode;
  sublocation?: SublocationNode;
}

// Legacy Location interface for backward compatibility
export interface Location {
  id: string;
  world_id: string;
  parent_location_id: string | null;
  adjacent_to: string[];
  children: string[];
  depth_level: number;
  name: string;
  dna: {
    world: WorldNode;
    region?: RegionNode;
    location?: LocationNode;
  };
  imagePath: string;
  focus?: FocusState;
}

interface LocationsState {
  // New tree-based storage
  nodes: Record<string, Node>;
  worldTrees: TreeNode[];
  pinnedIds: string[];
  
  // Node CRUD operations
  createNode: (node: Omit<Node, 'id'> & { id?: string }) => string;
  getNode: (id: string) => Node | undefined;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  getAllNodes: () => Node[];
  
  // Tree operations
  deleteWorldTree: (worldId: string) => void;
  getWorldNodeCount: (worldId: string) => number;
  getWorldTree: (worldId: string) => TreeNode | undefined;
  addNodeToTree: (worldId: string, parentId: string | null, nodeId: string, type: NodeType) => void;
  removeNodeFromTree: (worldId: string, nodeId: string) => void;
  findNodeInTree: (tree: TreeNode, nodeId: string) => TreeNode | null;
  getTreePath: (worldId: string, nodeId: string) => string[];
  
  // DNA operations
  getCascadedDNA: (nodeId: string) => CascadedDNA;
  
  // Spatial navigation
  getSpatialNodes: (currentNodeId: string) => Node[];
  
  // Pin operations
  togglePinned: (id: string) => void;
  isPinned: (id: string) => boolean;
  getPinnedNodes: () => Node[];
  
  // Bulk operations
  clearAll: () => void;
  
  // Focus management
  updateNodeFocus: (nodeId: string, focus: FocusState) => void;
  getNodeFocus: (nodeId: string) => FocusState | undefined;
  ensureFocusInitialized: (nodeId: string) => void;
  
  // Legacy compatibility methods (deprecated but kept for migration)
  createLocation: (location: Omit<Location, 'id'> & { id?: string }) => string;
  getLocation: (id: string) => Location | undefined;
  getLocationsByWorld: (world_id: string) => Location[];
}

// Tree traversal utilities
const findNodeInTreeRecursive = (tree: TreeNode, targetId: string): TreeNode | null => {
  if (tree.id === targetId) return tree;
  
  for (const child of tree.children) {
    const found = findNodeInTreeRecursive(child, targetId);
    if (found) return found;
  }
  
  return null;
};

const getAncestorsRecursive = (tree: TreeNode, targetId: string, path: string[] = []): string[] | null => {
  path.push(tree.id);
  
  if (tree.id === targetId) {
    return path;
  }
  
  for (const child of tree.children) {
    const found = getAncestorsRecursive(child, targetId, [...path]);
    if (found) return found;
  }
  
  return null;
};

const getSiblingsInTree = (tree: TreeNode, targetId: string, parentId: string | null = null): string[] => {
  if (parentId === null) {
    // Looking for siblings of root - there are none
    return [];
  }
  
  // Find parent node
  const findParent = (node: TreeNode): TreeNode | null => {
    if (node.id === parentId) return node;
    for (const child of node.children) {
      const found = findParent(child);
      if (found) return found;
    }
    return null;
  };
  
  const parent = findParent(tree);
  if (!parent) return [];
  
  // Return all children except target
  return parent.children.filter(c => c.id !== targetId).map(c => c.id);
};

const getDescendantsRecursive = (tree: TreeNode): string[] => {
  const descendants: string[] = [];
  
  for (const child of tree.children) {
    descendants.push(child.id);
    descendants.push(...getDescendantsRecursive(child));
  }
  
  return descendants;
};

const removeNodeFromTreeRecursive = (tree: TreeNode, targetId: string): boolean => {
  const index = tree.children.findIndex(c => c.id === targetId);
  if (index !== -1) {
    tree.children.splice(index, 1);
    return true;
  }
  
  for (const child of tree.children) {
    if (removeNodeFromTreeRecursive(child, targetId)) {
      return true;
    }
  }
  
  return false;
};

export const useLocationsStore = create<LocationsState>()(
  persist(
    (set, get) => ({
      nodes: {},
      worldTrees: [],
      pinnedIds: [],
      
      // Node CRUD
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
      },
      
      deleteNode: (id) => {
        set((state) => {
          const { [id]: deleted, ...rest } = state.nodes;
          return { nodes: rest };
        });
      },
      
      getAllNodes: () => {
        return Object.values(get().nodes);
      },
      
      // Delete entire world tree (all nodes in the tree)
      deleteWorldTree: (worldId: string) => {
        const { nodes, worldTrees, pinnedIds } = get();
        
        // Find the world tree
        const treeIndex = worldTrees.findIndex(t => t.id === worldId);
        if (treeIndex === -1) {
          console.warn('[locationsSlice] World tree not found:', worldId);
          return;
        }
        
        // Collect all node IDs in the tree (recursive)
        const nodeIdsToDelete = new Set<string>();
        const collectNodeIds = (treeNode: TreeNode) => {
          nodeIdsToDelete.add(treeNode.id);
          treeNode.children?.forEach(child => collectNodeIds(child));
        };
        collectNodeIds(worldTrees[treeIndex]);
        
        // Delete all nodes from nodes map
        const newNodes = { ...nodes };
        nodeIdsToDelete.forEach(id => delete newNodes[id]);
        
        // Remove tree from worldTrees array
        const newTrees = worldTrees.filter((_, i) => i !== treeIndex);
        
        // Clean up pins
        const newPinnedIds = pinnedIds.filter(id => !nodeIdsToDelete.has(id));
        
        set({
          nodes: newNodes,
          worldTrees: newTrees,
          pinnedIds: newPinnedIds
        });
        
      },
      
      // Get count of nodes in a world tree
      getWorldNodeCount: (worldId: string) => {
        const { worldTrees } = get();
        const tree = worldTrees.find(t => t.id === worldId);
        if (!tree) return 0;
        
        let count = 0;
        const traverse = (node: TreeNode) => {
          count++;
          node.children?.forEach(traverse);
        };
        traverse(tree);
        return count;
      },
      
      // Tree operations
      getWorldTree: (worldId) => {
        return get().worldTrees.find(tree => tree.id === worldId);
      },
      
      addNodeToTree: (worldId, parentId, nodeId, type) => {
        set((state) => {
          const trees = [...state.worldTrees];
          
          if (parentId === null) {
            // Adding a new world root
            trees.push({
              id: nodeId,
              type,
              children: [],
            });
          } else {
            // Adding to existing tree
            const worldTree = trees.find(t => t.id === worldId);
            if (!worldTree) {
              console.error(`[locationsSlice] World tree not found: ${worldId}`);
              return state;
            }
            
            // Find parent and add child
            const addToParent = (node: TreeNode): boolean => {
              if (node.id === parentId) {
                node.children.push({
                  id: nodeId,
                  type,
                  children: [],
                });
                return true;
              }
              
              for (const child of node.children) {
                if (addToParent(child)) return true;
              }
              
              return false;
            };
            
            if (!addToParent(worldTree)) {
              console.error(`[locationsSlice] Parent node not found in tree: ${parentId}`);
              return state;
            }
          }
          
          return { worldTrees: trees };
        });
      },
      
      removeNodeFromTree: (worldId, nodeId) => {
        set((state) => {
          const trees = [...state.worldTrees];
          const worldTree = trees.find(t => t.id === worldId);
          
          if (!worldTree) return state;
          
          if (worldTree.id === nodeId) {
            // Removing entire world tree
            return {
              worldTrees: trees.filter(t => t.id !== worldId),
            };
          }
          
          removeNodeFromTreeRecursive(worldTree, nodeId);
          return { worldTrees: trees };
        });
      },
      
      findNodeInTree: (tree, nodeId) => {
        return findNodeInTreeRecursive(tree, nodeId);
      },
      
      getTreePath: (worldId, nodeId) => {
        const worldTree = get().getWorldTree(worldId);
        if (!worldTree) return [];
        
        const path = getAncestorsRecursive(worldTree, nodeId);
        return path || [];
      },
      
      // DNA operations
      getCascadedDNA: (nodeId) => {
        const node = get().getNode(nodeId);
        if (!node) return {};
        
        // Find world tree containing this node
        const worldTree = get().worldTrees.find(tree => 
          findNodeInTreeRecursive(tree, nodeId) !== null
        );
        
        if (!worldTree) return {};
        
        // Get path from world root to this node
        const path = getAncestorsRecursive(worldTree, nodeId) || [];
        
        // Collect DNA from each node in path
        const cascaded: CascadedDNA = {};
        
        for (const id of path) {
          const pathNode = get().getNode(id);
          if (!pathNode) continue;
          
          switch (pathNode.type) {
            case 'world':
              cascaded.world = pathNode.dna as WorldNode;
              break;
            case 'region':
              cascaded.region = pathNode.dna as RegionNode;
              break;
            case 'location':
              cascaded.location = pathNode.dna as LocationNode;
              break;
            case 'sublocation':
              cascaded.sublocation = pathNode.dna as SublocationNode;
              break;
          }
        }
        
        return cascaded;
      },
      
      // Spatial navigation
      getSpatialNodes: (currentNodeId) => {
        const currentNode = get().getNode(currentNodeId);
        if (!currentNode) return [];
        
        // Find world tree containing this node
        const worldTree = get().worldTrees.find(tree => 
          findNodeInTreeRecursive(tree, currentNodeId) !== null
        );
        
        if (!worldTree) return [];
        
        const spatialIds = new Set<string>();
        
        // Add current node
        spatialIds.add(currentNodeId);
        
        // Get path (ancestors)
        const path = getAncestorsRecursive(worldTree, currentNodeId) || [];
        path.forEach(id => spatialIds.add(id));
        
        // Get parent ID
        const parentId = path.length > 1 ? path[path.length - 2] : null;
        
        // Get siblings
        const siblings = getSiblingsInTree(worldTree, currentNodeId, parentId);
        siblings.forEach(id => spatialIds.add(id));
        
        // Get children
        const currentTreeNode = findNodeInTreeRecursive(worldTree, currentNodeId);
        if (currentTreeNode) {
          const children = getDescendantsRecursive(currentTreeNode);
          children.forEach(id => spatialIds.add(id));
        }
        
        // Convert IDs to nodes
        return Array.from(spatialIds)
          .map(id => get().getNode(id))
          .filter(Boolean) as Node[];
      },
      
      // Pin operations
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
      
      // Bulk operations
      clearAll: () => {
        set({ nodes: {}, worldTrees: [], pinnedIds: [] });
      },
      
      // Focus management
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
      
      // Legacy compatibility methods
      createLocation: (location) => {
        console.warn('[locationsSlice] createLocation is deprecated - use tree-based methods');
        
        const id = location.id || uuidv4();
        
        // Extract nodes from nested DNA
        const worldNode: Node = {
          id: location.world_id,
          type: 'world',
          name: location.dna.world.meta.name,
          dna: location.dna.world,
          imagePath: '',
          focus: undefined,
        };
        
        // Create world node if it doesn't exist
        if (!get().getNode(location.world_id)) {
          get().createNode(worldNode);
          get().addNodeToTree(location.world_id, null, location.world_id, 'world');
        }
        
        // Create region node if exists
        if (location.dna.region) {
          const regionId = `${location.world_id}-region`;
          if (!get().getNode(regionId)) {
            const regionNode: Node = {
              id: regionId,
              type: 'region',
              name: location.dna.region.meta.name,
              dna: location.dna.region,
              imagePath: '',
              focus: undefined,
            };
            get().createNode(regionNode);
            get().addNodeToTree(location.world_id, location.world_id, regionId, 'region');
          }
        }
        
        // Create location node
        if (location.dna.location) {
          const locationNode: Node = {
            id,
            type: 'location',
            name: location.name,
            dna: location.dna.location,
            imagePath: location.imagePath,
            focus: location.focus,
          };
          
          get().createNode(locationNode);
          
          const parentId = location.dna.region 
            ? `${location.world_id}-region`
            : location.world_id;
          
          get().addNodeToTree(location.world_id, parentId, id, 'location');
        }
        
        return id;
      },
      
      getLocation: (id) => {
        console.warn('[locationsSlice] getLocation is deprecated - use getNode');
        const node = get().getNode(id);
        if (!node) return undefined;
        
        // Build legacy location object
        const cascaded = get().getCascadedDNA(id);
        
        return {
          id: node.id,
          world_id: cascaded.world ? Object.keys(get().nodes).find(k => get().nodes[k].type === 'world') || '' : '',
          parent_location_id: null,
          adjacent_to: [],
          children: [],
          depth_level: 0,
          name: node.name,
          dna: cascaded as any,
          imagePath: node.imagePath,
          focus: node.focus,
        } as Location;
      },
      
      getLocationsByWorld: (world_id) => {
        console.warn('[locationsSlice] getLocationsByWorld is deprecated - use getSpatialNodes');
        return get().getSpatialNodes(world_id).map(node => get().getLocation(node.id)).filter(Boolean) as Location[];
      },
    }),
    {
      name: 'morfeum-locations-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        worldTrees: state.worldTrees,
        pinnedIds: state.pinnedIds,
      }),
    }
  )
);
