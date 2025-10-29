/**
 * Legacy Slice - Backward compatibility (DEPRECATED)
 * Maintains compatibility with old Location interface
 * TO BE REMOVED: Use tree-based methods instead
 */

import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Location, Node } from './types';
import { NodesSlice } from './nodesSlice';
import { TreesSlice } from './treesSlice';
import { DNASlice } from './dnaSlice';

export interface LegacySlice {
  // Legacy compatibility methods (deprecated)
  createLocation: (location: Omit<Location, 'id'> & { id?: string }) => string;
  getLocation: (id: string) => Location | undefined;
  getLocationsByWorld: (world_id: string) => Location[];
}

export const createLegacySlice: StateCreator<
  LegacySlice & NodesSlice & TreesSlice & DNASlice,
  [],
  [],
  LegacySlice
> = (set, get) => ({
  createLocation: (location) => {
    console.warn('[legacySlice] createLocation is deprecated - use tree-based methods');
    
    const id = location.id || uuidv4();
    
    // Extract nodes from nested DNA
    const hostNode: Node = {
      id: location.world_id,
      type: 'host',
      name: location.dna.world.meta.name,
      dna: location.dna.world,
      imagePath: '',
      focus: undefined,
    };
    
    // Create host node if it doesn't exist
    if (!get().getNode(location.world_id)) {
      get().createNode(hostNode);
      get().addNodeToTree(location.world_id, null, location.world_id, 'host');
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
    console.warn('[legacySlice] getLocation is deprecated - use getNode');
    const node = get().getNode(id);
    if (!node) return undefined;
    
    // Build legacy location object
    const cascaded = get().getCascadedDNA(id);
    
    // Find world ID
    const worldTrees = get().worldTrees;
    const worldTree = worldTrees.find(tree => 
      get().findNodeInTree(tree, id) !== null
    );
    
    return {
      id: node.id,
      world_id: worldTree?.id || '',
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
    console.warn('[legacySlice] getLocationsByWorld is deprecated - use getSpatialNodes');
    return get().getSpatialNodes(world_id)
      .map(node => get().getLocation(node.id))
      .filter(Boolean) as Location[];
  },
});
