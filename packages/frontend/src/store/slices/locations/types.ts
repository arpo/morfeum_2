/**
 * Shared types for locations storage
 * Tree-Based Architecture: Nodes (flat) + World Trees (nested)
 */

// Focus state for tracking current view
export interface FocusState {
  node_id: string;
  perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
  viewpoint: string;
  distance: 'close' | 'medium' | 'far';
  currentViewId?: string;
}

// View interface - multiple views per node
export interface View {
  id: string;
  nodeId: string;
  imagePath?: string;
  perspective: string;
  viewpoint: string;
  focusTarget: string;
  searchDesc: string;
}

// Node types
export type NodeType = 'host' | 'region' | 'location' | 'niche';

// DNA type definitions (single-layer per node)
export interface HostNode {
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

export interface NicheNode {
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
  dna: HostNode | RegionNode | LocationNode | NicheNode;
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
  world?: HostNode;
  region?: RegionNode;
  location?: LocationNode;
  niche?: NicheNode;
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
    world: HostNode;
    region?: RegionNode;
    location?: LocationNode;
  };
  imagePath: string;
  focus?: FocusState;
}
