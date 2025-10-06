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

export interface EntitySeed {
  name: string;
  looks: string;
  wearing: string;
  personality: string;
  imageUrl?: string;
  visualAnalysis?: VisualAnalysis;
  deepProfile?: DeepProfile;
}

export interface EntityGeneratorState {
  textPrompt: string;
  generatedSeed: EntitySeed | null;
  loading: boolean;
  imageLoading: boolean;
  analysisLoading: boolean;
  profileLoading: boolean;
  error: string | null;
}

export interface EntityGeneratorHandlers {
  setTextPrompt: (value: string) => void;
  generateSeed: () => void;
  shufflePrompt: () => void;
  clearError: () => void;
}

export interface EntityGeneratorLogicReturn {
  state: EntityGeneratorState;
  handlers: EntityGeneratorHandlers;
}
