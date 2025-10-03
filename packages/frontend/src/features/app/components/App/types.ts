export interface AppState {
  backendMessage: string;
  loading: boolean;
  error: string | null;
}

export interface AppHandlers {
  callBackend: () => Promise<void>;
  clearMessage: () => void;
}

export interface AppComputed {
  hasMessage: boolean;
  displayMessage: string;
}

export interface AppLogicReturn {
  state: AppState;
  handlers: AppHandlers;
  computed: AppComputed;
}
