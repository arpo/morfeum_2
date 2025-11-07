/**
 * Location Types - Location-specific spawn types
 */

import { VisualAnchors } from './common';

export interface LocationSeed {
  originalPrompt?: string;
  classification?: {
    primarySubject: 'host' | 'region' | 'location';
    targetName: string;
    context?: string;
  };
  name: string;
  looks: string;
  atmosphere: string;
  mood: string;
  renderInstructions: string;
  scale_hint?: 'macro' | 'area' | 'site' | 'interior' | 'detail';
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
}

// Hierarchical location DNA types
export interface HostNode {
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
  };
}

// NEW: Unified NodeDNA structure (flat, simplified)
export interface NodeDNA {
  // Visual essentials
  looks: string;
  colorsAndLighting: string;
  atmosphere: string;
  architectural_tone: string;
  materials: string;
  mood: string;
  sounds: string;
  
  // Visual anchors (critical for consistency and navigation)
  visualAnchors: VisualAnchors;
  
  // Navigation context
  searchDesc: string;
  
  // Metadata
  fictional: boolean;
  copyright: boolean;
}

// Multi-view text descriptions (prepared for future)
export interface ViewDescription {
  viewKey: string;
  looks: string;
  focusTarget: string;
  renderInstructions: string;
  hasImage: boolean;
}

export interface ViewDescriptions {
  [viewKey: string]: ViewDescription;
}

// NEW: Simplified location deep profile (just NodeDNA)
export type LocationDeepProfileV2 = NodeDNA;
