import type { EntityPanelBaseState, EntityPanelBaseHandlers } from '../../types';

export interface LocationPanelState extends EntityPanelBaseState {}

export interface LocationPanelHandlers extends EntityPanelBaseHandlers {
  saveLocation: () => void;
}

export interface LocationPanelLogicReturn {
  state: LocationPanelState;
  handlers: LocationPanelHandlers;
}
