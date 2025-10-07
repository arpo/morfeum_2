export interface SpawnInputBarState {
  textPrompt: string;
  error: string | null;
}

export interface SpawnInputBarHandlers {
  setTextPrompt: (value: string) => void;
  handleGenerate: () => void;
  handleShuffle: () => void;
  clearError: () => void;
}

export interface SpawnInputBarLogicReturn {
  state: SpawnInputBarState;
  handlers: SpawnInputBarHandlers;
}
