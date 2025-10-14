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

export interface VisualAnchors {
  dominantElements: string[];
  spatialLayout: string;
  surfaceMaterialMap: {
    primary_surfaces: string;
    secondary_surfaces: string;
    accent_features: string;
  };
  colorMapping: {
    dominant: string;
    secondary: string;
    accent: string;
    ambient: string;
  };
  uniqueIdentifiers: string[];
}

export interface LocationVisualAnalysis {
  looks: string;
  colorsAndLighting: string;
  atmosphere: string;
  vegetation: string;
  architecture: string;
  animals: string;
  mood: string;
  visualAnchors: VisualAnchors;
  viewContext: {
    perspective: string;
    focusTarget: string;
    distance: string;
    composition: string;
  };
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
    primarySubject: 'world' | 'region' | 'location';
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
  };
  spatial: {
    orientation: {
      light_behavior: string;
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
    visualAnchors: VisualAnchors;
    viewContext: {
      perspective: string;
      focusTarget: string;
      distance: string;
      composition: string;
    };
  };
}

export interface LocationDeepProfile {
  world: WorldNode;
  region?: RegionNode;
  location?: LocationNode;
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
}
