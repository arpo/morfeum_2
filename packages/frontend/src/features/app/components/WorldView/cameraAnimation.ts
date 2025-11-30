/**
 * Camera Animation for WorldView
 * Handles animation loop, easing, and camera movement calculations
 */

import { WORLD_VIEW_3D_CONFIG } from '@/config';

export interface CameraConfig {
  amplitudeX: number;
  amplitudeY: number;
  amplitudeZ: number;
  amplitudeRoll: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  speedRoll: number;
  positionX: number;
  positionY: number;
  baseCameraZ: number;
}

export interface CameraMovement {
  x: number;
  y: number;
  z: number;
  roll: number;
  posX: number;
  posY: number;
}

/**
 * Create camera config from WORLD_VIEW_3D_CONFIG
 */
export function createCameraConfig(): CameraConfig {
  return {
    amplitudeX: WORLD_VIEW_3D_CONFIG.CAMERA_AMPLITUDE.X,
    amplitudeY: WORLD_VIEW_3D_CONFIG.CAMERA_AMPLITUDE.Y,
    amplitudeZ: WORLD_VIEW_3D_CONFIG.CAMERA_AMPLITUDE.Z,
    amplitudeRoll: WORLD_VIEW_3D_CONFIG.CAMERA_AMPLITUDE.ROLL,
    speedX: WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.X * WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.MULTIPLIER,
    speedY: WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.Y * WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.MULTIPLIER,
    speedZ: WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.Z * WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.MULTIPLIER,
    speedRoll: WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.ROLL * WORLD_VIEW_3D_CONFIG.CAMERA_SPEED.MULTIPLIER,
    positionX: WORLD_VIEW_3D_CONFIG.CAMERA_POSITION.X,
    positionY: WORLD_VIEW_3D_CONFIG.CAMERA_POSITION.Y,
    baseCameraZ: WORLD_VIEW_3D_CONFIG.BASE_CAMERA_Z
  };
}

/**
 * Apply ease-in-out to a value using power curve
 * Power > 1 creates more pronounced easing at direction changes
 */
export function easeInOut(value: number, power: number = 1.5): number {
  // Preserve sign, apply power curve to absolute value
  return Math.sign(value) * Math.pow(Math.abs(value), power);
}

/**
 * Get camera movement position (independent circular patterns for X, Y, Z)
 */
export function getCameraMovementPosition(config: CameraConfig): CameraMovement {
  const now = Date.now();
  
  // Raw sin/cos values (-1 to 1)
  const rawX = Math.cos(now * config.speedX);
  const rawY = Math.sin(now * config.speedY);
  const rawZ = Math.sin(now * config.speedZ);
  const rawRoll = Math.sin(now * config.speedRoll);
  
  // Apply easing for smooth direction changes (slower at peaks, faster in middle)
  const easedX = easeInOut(rawX);
  const easedY = easeInOut(rawY);
  const easedZ = easeInOut(rawZ);
  const easedRoll = easeInOut(rawRoll);
  
  // Apply amplitude
  const x = easedX * config.amplitudeX;
  const y = easedY * config.amplitudeY;
  // Z only zooms IN (negative = closer to image), never OUT to avoid black edges
  const z = -Math.abs(easedZ * config.amplitudeZ);
  // Camera roll (tilt) - rotates around Z axis for head tilt effect
  const roll = easedRoll * config.amplitudeRoll;
  
  // Physical camera position for tilt effect (uses same eased values)
  const posX = easedX * config.positionX;
  const posY = easedY * config.positionY;

  return { x, y, z, roll, posX, posY };
}

/**
 * Calculate smooth easing toward target values
 */
export function smoothToTarget(
  currentX: number,
  currentY: number,
  mouseX: number,
  mouseY: number,
  focus: number,
  easing: number
): { targetX: number; targetY: number } {
  const mouseSensitivityFocusFactor = 0.3 + 0.7 * 2 * focus;
  const targetX = currentX + (mouseSensitivityFocusFactor * mouseX * 0.5 - currentX) * easing;
  const targetY = currentY + (mouseSensitivityFocusFactor * mouseY * 0.5 - currentY) * easing;
  
  return { targetX, targetY };
}

/**
 * Calculate scissor dimensions for letterboxing
 */
export function calculateScissorDimensions(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number
): { scissorX: number; scissorY: number; scissorWidth: number; scissorHeight: number } {
  const containerAspect = containerWidth / containerHeight;

  let scissorWidth: number;
  let scissorHeight: number;

  if (containerAspect > imageAspectRatio) {
    scissorHeight = containerHeight;
    scissorWidth = containerHeight * imageAspectRatio;
  } else {
    scissorWidth = containerWidth;
    scissorHeight = containerWidth / imageAspectRatio;
  }
  
  const scissorX = (containerWidth - scissorWidth) / 2;
  const scissorY = (containerHeight - scissorHeight) / 2;

  return { scissorX, scissorY, scissorWidth, scissorHeight };
}
