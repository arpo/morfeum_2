/**
 * Locations Storage Slice
 * Provides temporary localStorage-based CRUD operations for locations
 * Will be replaced with real database calls in the future
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Location interface matching database table structure
export interface Location {
  id: string;
  world_id: string;
  parent_location_id: string | null;
  adjacent_to: string[];
  children: string[];
  depth_level: number;
  name: string;
  details: Record<string, any>;
  imagePath: string;
}

interface LocationsState {
  locations: Record<string, Location>;
  
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
  
  // Bulk operations
  clearAllLocations: () => void;
  importLocations: (locations: Location[]) => void;
}

export const useLocationsStore = create<LocationsState>()(
  persist(
    (set, get) => ({
      locations: {},
      
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
      
      clearAllLocations: () => {
        set({ locations: {} });
      },
      
      importLocations: (locations) => {
        const locationsMap = locations.reduce((acc, location) => {
          acc[location.id] = location;
          return acc;
        }, {} as Record<string, Location>);
        
        set({ locations: locationsMap });
      },
    }),
    {
      name: 'morfeum-locations-storage',
      partialize: (state) => ({ locations: state.locations }),
    }
  )
);
