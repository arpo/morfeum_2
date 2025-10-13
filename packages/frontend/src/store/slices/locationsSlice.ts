/**
 * Locations Storage Slice
 * Provides temporary localStorage-based CRUD operations for locations
 * Will be replaced with real database calls in the future
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Hierarchical location DNA types (matching backend)
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
  };
  spatial: {
    scale: {
      ceiling_height_m: number | null;
      room_length_m: number | null;
      room_width_m: number | null;
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
  };
  suggestedDestinations: Array<{
    name: string;
    action: string;
    relation: string;
    slug_hint: string;
  }>;
}

// Location interface with hierarchical DNA structure
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
    sublocation?: SublocationNode;
  };
  imagePath: string;
}

// Location hierarchy with populated children
export interface LocationHierarchyNode extends Omit<Location, 'children'> {
  children: Location[];
}

interface LocationsState {
  locations: Record<string, Location>;
  pinnedIds: string[];
  
  // CRUD operations
  createLocation: (location: Omit<Location, 'id'> & { id?: string }) => string;
  getLocation: (id: string) => Location | undefined;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  
  // Query operations
  getLocationsByWorld: (world_id: string) => Location[];
  getChildLocations: (parent_id: string) => Location[];
  getAdjacentLocations: (id: string) => Location[];
  getAllLocations: () => Location[];
  
  // Pin operations
  togglePinned: (id: string) => void;
  isPinned: (id: string) => boolean;
  getPinnedLocations: () => Location[];
  
  // Bulk operations
  clearAllLocations: () => void;
  importLocations: (locations: Location[]) => void;
  
  // Helper methods for World DNA management
  getRootLocation: (world_id: string) => Location;
  getWorldDNA: (world_id: string) => Record<string, any>;
  getLocationHierarchy: () => LocationHierarchyNode[];
}

export const useLocationsStore = create<LocationsState>()(
  persist(
    (set, get) => ({
      locations: {},
      pinnedIds: [],
      
      createLocation: (location) => {
        const id = location.id || uuidv4();
        const newLocation: Location = {
          ...location,
          id,
        };
        
        set((state) => ({
          locations: {
            ...state.locations,
            [id]: newLocation,
          },
        }));
        
        return id;
      },
      
      getLocation: (id) => {
        return get().locations[id];
      },
      
      updateLocation: (id, updates) => {
        set((state) => {
          const existing = state.locations[id];
          if (!existing) return state;
          
          return {
            locations: {
              ...state.locations,
              [id]: {
                ...existing,
                ...updates,
              },
            },
          };
        });
      },
      
      deleteLocation: (id) => {
        set((state) => {
          const { [id]: deleted, ...rest } = state.locations;
          return { locations: rest };
        });
      },
      
      getLocationsByWorld: (world_id) => {
        return Object.values(get().locations).filter(
          (location) => location.world_id === world_id
        );
      },
      
      getChildLocations: (parent_id) => {
        return Object.values(get().locations).filter(
          (location) => location.parent_location_id === parent_id
        );
      },
      
      getAdjacentLocations: (id) => {
        const location = get().locations[id];
        if (!location) return [];
        
        return location.adjacent_to
          .map((adjacentId) => get().locations[adjacentId])
          .filter(Boolean) as Location[];
      },
      
      getAllLocations: () => {
        return Object.values(get().locations);
      },
      
      togglePinned: (id) => {
        const location = get().locations[id];
        if (!location) return;
        
        set((state) => {
          const pinnedIds = [...state.pinnedIds];
          const index = pinnedIds.indexOf(id);
          
          if (index > -1) {
            // Already pinned, unpin it
            pinnedIds.splice(index, 1);
          } else {
            // Not pinned, pin it
            pinnedIds.push(id);
          }
          
          return { pinnedIds };
        });
      },
      
      isPinned: (id) => {
        return get().pinnedIds.includes(id);
      },
      
      getPinnedLocations: () => {
        const pinnedIds = get().pinnedIds;
        return pinnedIds
          .map(id => get().locations[id])
          .filter(Boolean) as Location[];
      },
      
      clearAllLocations: () => {
        set({ locations: {}, pinnedIds: [] });
      },
      
  importLocations: (locations) => {
    const locationsMap = locations.reduce((acc, location) => {
      acc[location.id] = location;
      return acc;
    }, {} as Record<string, Location>);
    
    set({ locations: locationsMap });
  },
  
  // Helper methods for World DNA management
  getRootLocation: (world_id) => {
    const locations = Object.values(get().locations);
    const root = locations.find(
      (loc) => loc.world_id === world_id && loc.parent_location_id === null
    );
    if (!root) {
      throw new Error(`No root location found for world ${world_id}`);
    }
    return root;
  },
  
  getWorldDNA: (world_id) => {
    const root = get().getRootLocation(world_id);
    return root.dna.world;
  },
  
  getLocationHierarchy: () => {
    const locations = Object.values(get().locations);
    
    // Build hierarchy tree
    const roots = locations.filter((loc) => loc.parent_location_id === null);
    const children = locations.filter((loc) => loc.parent_location_id !== null);
    
    return roots.map((root) => ({
      ...root,
      children: children.filter((child) => child.parent_location_id === root.id),
    }));
  },
    }),
    {
      name: 'morfeum-locations-storage',
      partialize: (state) => ({ 
        locations: state.locations,
        pinnedIds: state.pinnedIds 
      }),
    }
  )
);
