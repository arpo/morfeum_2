/**
 * Common Types - Shared across all spawn types
 */

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

export interface CurrentView {
  viewKey: string;
  imagePath: string;
  focusTarget: string;
}

export interface CachedImage {
  imagePath: string;
  generatedAt: string;
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
  seed?: any;
  imageUrl?: string;
  imagePrompt?: string;
  visualAnalysis?: any;
  deepProfile?: any;
  error?: string;
  createdAt: number;
  abortController: AbortController;
  movementContext?: MovementContext;
}
