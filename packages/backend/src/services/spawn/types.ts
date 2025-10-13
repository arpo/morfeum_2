/**
 * Spawn Manager Type Definitions
 */

export interface EntitySeed {
  originalPrompt?: string;
  name: string;
  looks: string;
  wearing: string;
  personality: string;
  presence?: string;
  setting?: string;
}

export interface VisualAnalysis {
  face: string;
  hair: string;
  body: string;
  specificdetails: string;
}

export interface LocationVisualAnalysis {
  looks: string;
  colorsAndLighting: string;
  atmosphere: string;
  vegetation: string;
  architecture: string;
  animals: string;
  mood: string;
}

export interface DeepProfile {
  name: string;
  looks: string;
  wearing: string;
  face: string;
  body: string;
  hair: string;
  specificDetails: string;
  style: string;
  personality: string;
  voice: string;
  speechStyle: string;
  gender: string;
  nationality: string;
  fictional: string;
  copyright: string;
  tags: string;
}

export interface LocationSeed {
  originalPrompt?: string;
  classification?: {
    primarySubject: 'world' | 'region' | 'location' | 'sublocation';
    targetName: string;
    context?: string;
  };
  name: string;
  looks: string;
  atmosphere: string;
  mood: string;
  renderInstructions: string;
}

// Hierarchical location DNA types
export interface WorldNode {
  meta: {
    name: string;
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
    camera: {
      framing_distance: string;
      angle: string;
      composition_bias: string;
      height: string;
      perspective?: string;
      depth_cues?: string;
    };
  };
  profile: {
    colorsAndLighting: string;
    symbolicThemes: string;
  };
}

export interface RegionNode {
  meta: {
    name: string;
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
    camera: {
      framing_distance: string;
      angle: string;
      composition_bias: string;
      height: string;
      perspective?: string;
      depth_cues?: string;
    };
  };
  profile: {
    colorsAndLighting: string;
    symbolicThemes: string;
  };
}

export interface LocationNode {
  meta: {
    name: string;
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
    camera: {
      framing_distance: string;
      angle: string;
      composition_bias: string;
      height: string;
      perspective?: string;
      depth_cues?: string;
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
  };
  suggestedDestinations: Array<{
    name: string;
    action: string;
    relation: string;
  }>;
}

export interface SublocationNode {
  meta: {
    name: string;
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
    camera: {
      framing_distance: string;
      angle: string;
      composition_bias: string;
      height: string;
      perspective?: string;
      depth_cues?: string;
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
  };
  suggestedDestinations: Array<{
    name: string;
    action: string;
    relation: string;
  }>;
}

export interface LocationDeepProfile {
  world: WorldNode;
  region?: RegionNode;
  location?: LocationNode;
  sublocation?: SublocationNode;
}

export interface MovementContext {
  movementType: 'descend' | 'ascend' | 'traverse' | 'jump';
  currentLocationId: string;
  currentLocationName: string;
  worldInfo?: any;
  locationInfo?: any;
  parentLocationId?: string | null;
  adjacentTo?: string[];
  depthLevel?: number;
}

export interface SpawnProcess {
  id: string;
  prompt: string;
  entityType: 'character' | 'location';
  status: 'generating_seed' | 'generating_image' | 'analyzing' | 'enriching' | 'completed' | 'cancelled' | 'error';
  seed?: Partial<EntitySeed | LocationSeed>;
  imageUrl?: string;
  imagePrompt?: string;
  visualAnalysis?: VisualAnalysis | LocationVisualAnalysis;
  deepProfile?: DeepProfile | LocationDeepProfile;
  error?: string;
  createdAt: number;
  abortController: AbortController;
  movementContext?: MovementContext;
  parentLocationId?: string;
  parentWorldDNA?: Record<string, any>;
}
