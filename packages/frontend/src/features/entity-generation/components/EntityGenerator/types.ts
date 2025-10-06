export interface EntitySeed {
  name: string;
  looks: string;
  wearing: string;
  personality: string;
  imageUrl?: string;
}

export interface EntityGeneratorState {
  textPrompt: string;
  generatedSeed: EntitySeed | null;
  loading: boolean;
  imageLoading: boolean;
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
