export interface AppState {
  backendMessage: string;
  loading: boolean;
  error: string | null;
  testData: any;
  testLoading: boolean;
  testError: string | null;
  geminiPrompt: string;
  geminiResponse: string;
  geminiLoading: boolean;
  geminiError: string | null;
  imagePrompt: string;
  imageUrl: string;
  imageLoading: boolean;
  imageError: string | null;
}

export interface AppHandlers {
  callBackend: () => Promise<void>;
  clearMessage: () => void;
  setGeminiPrompt: (prompt: string) => void;
  generateText: () => Promise<void>;
  clearGeminiResponse: () => void;
  setImagePrompt: (prompt: string) => void;
  generateImage: () => Promise<void>;
  clearImageResponse: () => void;
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
