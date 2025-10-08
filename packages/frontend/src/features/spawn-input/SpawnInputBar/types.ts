export interface SpawnInputBarState {
  textPrompt: string;
  entityType: 'character' | 'location';
  error: string | null;
}

export interface SpawnInputBarHandlers {
  setTextPrompt: (value: string) => void;
  setEntityType: (type: 'character' | 'location') => void;
  handleGenerate: () => void;
  handleShuffle: () => void;
  clearError: () => void;
}

export interface SpawnInputBarLogicReturn {
  state: SpawnInputBarState;
  handlers: SpawnInputBarHandlers;
}
