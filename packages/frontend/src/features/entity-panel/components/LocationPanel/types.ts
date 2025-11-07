import type { EntityPanelBaseState, EntityPanelBaseHandlers } from '../../types';

export interface LocationPanelState extends EntityPanelBaseState {
  movementInput: string;
  isMoving: boolean;
  createImage: boolean;
  previewImage: string | null;
}

export interface LocationPanelHandlers extends EntityPanelBaseHandlers {
  setMovementInput: (value: string) => void;
  handleMove: () => Promise<void>;
  saveLocation: () => void;
  setCreateImage: (value: boolean) => void;
  clearPreviewImage: () => void;
}

export interface LocationPanelLogicReturn {
  state: LocationPanelState;
  handlers: LocationPanelHandlers;
}
