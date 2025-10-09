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
  name: string;
  looks: string;
  atmosphere: string;
  mood: string;
}

export interface LocationDeepProfile {
  name: string;
  looks: string;
  atmosphere: string;
  vegetation: string;
  architecture: string;
  animals: string;
  mood: string;
  sounds: string;
  genre: string;
  fictional: string;
  copyright: string;
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
