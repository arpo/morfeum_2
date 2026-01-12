/**
 * V2 Command Types
 */

export interface V2CommandCallbacks {
  setIsMoving: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setMovementInput: (value: string) => void;
}

export interface V2CommandResult {
  success: boolean;
  error?: string;
  host?: any;
}
