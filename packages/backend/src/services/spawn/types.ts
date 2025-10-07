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

export interface SpawnProcess {
  id: string;
  prompt: string;
  status: 'generating_seed' | 'generating_image' | 'analyzing' | 'enriching' | 'completed' | 'cancelled' | 'error';
  seed?: Partial<EntitySeed>;
  imageUrl?: string;
  visualAnalysis?: VisualAnalysis;
  deepProfile?: DeepProfile;
  error?: string;
  createdAt: number;
  abortController: AbortController;
}
