import type { EntityPanelBaseState, EntityPanelBaseHandlers } from '../../types';

export interface LocationPanelState extends EntityPanelBaseState {
  movementInput: string;
  isMoving: boolean;
}

export interface LocationPanelHandlers extends EntityPanelBaseHandlers {
  setMovementInput: (value: string) => void;
  handleMove: () => Promise<void>;
  saveLocation: () => void;
}

export interface LocationPanelLogicReturn {
  state: LocationPanelState;
  handlers: LocationPanelHandlers;
}
