/**
 * Shared types for entity panels
 */

export interface EntityPanelBaseState {
  entityImage: string | null;
  entityName: string | null;
  entityPersonality: string | null;
  deepProfile: Record<string, any> | null;
  isModalOpen: boolean;
  isFullscreenOpen: boolean;
  isSaved: boolean;
}

export interface EntityPanelBaseHandlers {
  openModal: () => void;
  closeModal: () => void;
  openFullscreen: () => void;
  closeFullscreen: () => void;
}
