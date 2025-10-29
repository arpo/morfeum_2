/**
 * Hierarchy Parser Utility
 * Converts nested hierarchy JSON into flat nodes + tree structure
 */

import { v4 as uuidv4 } from 'uuid';
import type { Node, NodeType, TreeNode } from '@/store/slices/locationsSlice';
import { initFocus } from './locationFocus';

export interface ParsedHierarchy {
  nodes: Node[];
  tree: TreeNode;
  deepestNodeId: string;
}

/**
 * Parse nested hierarchy into flat nodes and tree structure
 */
export function parseNestedHierarchy(hierarchy: any, spawnId: string, imageUrl?: string): ParsedHierarchy {
  const nodes: Node[] = [];
  const host = hierarchy.host;
  
  if (!host) {
    throw new Error('Hierarchy must have a host node');
  }

  // Create host/world node
  const hostNode: Node = {
    id: spawnId,
    type: 'host',
    name: host.name,
    dna: extractHostDNA(host),
    imagePath: imageUrl || host.imageUrl || '',
    focus: initFocus({ name: host.name, dna: host.dna || host } as any)
  };
  nodes.push(hostNode);

  const tree: TreeNode = {
    id: spawnId,
    type: 'host',
    children: []
  };

  let deepestNodeId = spawnId;

  // Parse regions
  if (host.regions && host.regions.length > 0) {
    host.regions.forEach((region: any) => {
      const regionId = uuidv4();
      const regionNode: Node = {
        id: regionId,
        type: 'region',
        name: region.name,
        dna: extractRegionDNA(region),
        imagePath: region.imageUrl || '',
        focus: initFocus({ name: region.name, dna: region.dna || region } as any)
      };
      nodes.push(regionNode);

      const regionTree: TreeNode = {
        id: regionId,
        type: 'region',
        children: []
      };
      tree.children.push(regionTree);
      deepestNodeId = regionId;

      // Parse locations
      if (region.locations && region.locations.length > 0) {
        region.locations.forEach((location: any) => {
          const locationId = uuidv4();
          const locationNode: Node = {
            id: locationId,
            type: 'location',
            name: location.name,
            dna: extractLocationDNA(location),
            imagePath: location.imageUrl || '',
            focus: initFocus({ name: location.name, dna: location.dna || location } as any)
          };
          nodes.push(locationNode);

          const locationTree: TreeNode = {
            id: locationId,
            type: 'location',
            children: []
          };
          regionTree.children.push(locationTree);
          deepestNodeId = locationId;

          // Parse niches (sublocations)
          if (location.niches && location.niches.length > 0) {
            location.niches.forEach((niche: any) => {
              const nicheId = uuidv4();
              const nicheNode: Node = {
                id: nicheId,
                type: 'niche',
                name: niche.name,
                dna: extractNicheDNA(niche),
                imagePath: niche.imageUrl || '',
                focus: initFocus({ name: niche.name, dna: niche.dna || niche } as any)
              };
              nodes.push(nicheNode);

              const nicheTree: TreeNode = {
                id: nicheId,
                type: 'niche',
                children: []
              };
              locationTree.children.push(nicheTree);
              deepestNodeId = nicheId;
            });
          }
        });
      }
    });
  }

  return {
    nodes,
    tree,
    deepestNodeId
  };
}

/**
 * Extract host/world DNA from nested structure
 */
function extractHostDNA(host: any): any {
  // Always restructure into proper format
  return {
    meta: {
      name: host.name,
      slug: host.slug || generateSlug(host.name)
    },
    semantic: {
      environment: host.environment || host.description || '',
      dominant_materials: ensureArray(host.dominant_materials),
      atmosphere: host.atmosphere || '',
      architectural_tone: host.dna?.architectural_tone || host.architectural_tone || '',
      genre: host.dna?.genre || host.genre || '',
      mood_baseline: host.dna?.mood_baseline || host.mood_baseline || host.mood || '',
      palette_bias: ensureArray(host.dna?.palette_bias || host.palette_bias || host.colors_dominant),
      physics: host.physics || 'standard'
    },
    spatial: {
      orientation: {
        light_behavior: host.lighting || 'natural'
      }
    },
    render: {
      style: host.style || 'photorealistic',
      lighting_defaults: host.lighting || 'natural',
      camera_defaults: host.camera || 'wide',
      seed: host.seed || ''
    },
    profile: {
      colorsAndLighting: host.colorsAndLighting || '',
      symbolicThemes: host.symbolicThemes || '',
      searchDesc: host.searchDesc || `[World] ${host.name}`
    }
  };
}

/**
 * Extract region DNA from nested structure
 */
function extractRegionDNA(region: any): any {
  // Always restructure into proper format
  return {
    meta: {
      name: region.name,
      slug: region.slug || generateSlug(region.name)
    },
    semantic: {
      environment: region.environment || region.description || '',
      climate: region.climate || '',
      weather_pattern: region.weather_pattern || '',
      architecture_style: region.dna?.architectural_tone || region.architecture_style || region.architectural_tone || '',
      mood: region.dna?.mood_baseline || region.mood || '',
      palette_shift: ensureArray(region.dna?.palette_bias || region.palette_shift || region.colors_dominant)
    },
    spatial: {
      orientation: {
        dominant_view_axis: region.dominant_view_axis || 'horizontal'
      }
    },
    render: {
      style: region.style || 'photorealistic',
      lighting_profile: region.lighting || 'natural',
      seed: region.seed || ''
    },
    profile: {
      colorsAndLighting: region.colorsAndLighting || '',
      symbolicThemes: region.symbolicThemes || '',
      searchDesc: region.searchDesc || `[Region] ${region.name}`
    }
  };
}

/**
 * Extract location DNA from nested structure
 */
function extractLocationDNA(location: any): any {
  // Always restructure into proper format
  return {
    meta: {
      name: location.name,
      slug: location.slug || generateSlug(location.name)
    },
    semantic: {
      environment: location.environment || location.description || '',
      terrain_or_interior: location.terrain_or_interior || 'exterior',
      structures: location.structures || [],
      vegetation: location.vegetation || { types: [], density: 'sparse' },
      fauna: location.fauna || { types: [], presence: 'none' },
      time_of_day: location.time_of_day || 'day',
      lighting: location.lighting || 'natural',
      weather_or_air: location.weather_or_air || 'clear',
      atmosphere: location.atmosphere || '',
      mood: location.mood || '',
      color_palette: ensureArray(location.color_palette || location.colors_dominant),
      soundscape: ensureArray(location.soundscape),
      genre: location.genre || ''
    },
    spatial: {
      scale: {
        primary_height_m: location.primary_height_m || null,
        scene_width_m: location.scene_width_m || null
      },
      placement: {
        key_subject_position: location.key_subject_position || 'center',
        camera_anchor: location.camera_anchor || 'eye-level'
      },
      orientation: {
        light_source_direction: location.light_source_direction || 'above',
        prevailing_wind_or_flow: location.prevailing_wind_or_flow || 'calm'
      },
      connectivity: {
        links_to: location.links_to || []
      }
    },
    render: {
      style: location.style || 'photorealistic',
      camera: location.camera || 'wide',
      composition: location.composition || 'balanced',
      lighting_profile: location.lighting || 'natural',
      seed: location.seed || ''
    },
    profile: {
      looks: location.looks || location.description || '',
      colorsAndLighting: location.colorsAndLighting || '',
      atmosphere: location.atmosphere || '',
      materials: location.materials_primary || '',
      mood: location.mood || '',
      sounds: location.soundscape?.join(', ') || '',
      symbolicThemes: location.symbolicThemes || '',
      airParticles: location.airParticles || '',
      fictional: location.fictional || false,
      copyright: location.copyright || false,
      searchDesc: location.searchDesc || `[Location] ${location.name}`
    },
    suggestedDestinations: location.suggestedDestinations || []
  };
}

/**
 * Extract niche/sublocation DNA from nested structure
 */
function extractNicheDNA(niche: any): any {
  // Always restructure into proper format
  return {
    meta: {
      name: niche.name,
      slug: niche.slug || generateSlug(niche.name)
    },
    semantic: {
      environment: niche.environment || niche.description || '',
      terrain_or_interior: niche.terrain_or_interior || 'interior',
      structures: niche.structures || [],
      vegetation: niche.vegetation,
      fauna: niche.fauna,
      lighting: niche.lighting || 'artificial',
      weather_or_air: niche.weather_or_air || 'still',
      atmosphere: niche.atmosphere || '',
      mood: niche.mood || '',
      color_palette: ensureArray(niche.color_palette || niche.colors_dominant),
      soundscape: ensureArray(niche.soundscape)
    },
    spatial: {
      scale: {
        ceiling_height_m: niche.ceiling_height_m || null,
        room_length_m: niche.room_length_m || null,
        room_width_m: niche.room_width_m || null
      },
      placement: {
        key_subject_position: niche.key_subject_position || 'center',
        camera_anchor: niche.camera_anchor || 'eye-level'
      },
      orientation: {
        dominant_view_axis: niche.dominant_view_axis || 'forward'
      },
      connectivity: {
        links_to: niche.links_to || []
      }
    },
    profile: {
      looks: niche.looks || niche.description || '',
      colorsAndLighting: niche.colorsAndLighting || '',
      atmosphere: niche.atmosphere || '',
      materials: niche.materials_primary || '',
      mood: niche.mood || '',
      sounds: niche.soundscape?.join(', ') || '',
      symbolicThemes: niche.symbolicThemes || '',
      airParticles: niche.airParticles || '',
      fictional: niche.fictional || false,
      copyright: niche.copyright || false,
      searchDesc: niche.searchDesc || `[Niche] ${niche.name}`
    }
  };
}

/**
 * Ensure a value is an array
 */
function ensureArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
