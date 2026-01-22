/**
 * Centralized event names for custom DOM events
 * Used throughout the application for component communication
 */
export const WORLD_VIEW_EVENTS = {
  /** Fired when WorldView content is ready for transition overlay to fade out */
  CONTENT_READY: 'worldViewContentReady',
  /** Fired when video loop is ready and playing (after stabilization delay) */
  VIDEO_LOOP_READY: 'videoLoopReady',
  /** Fired when depth map generation completes */
  DEPTH_MAP_GENERATED: 'depthMapGenerated',
  /** Fired when image upscaling completes */
  IMAGE_UPSCALED: 'imageUpscaled',
  /** Fired when video generation completes */
  VIDEO_GENERATED: 'videoGenerated',
  /** Fired when display mode changes (2d, full, hsbs) */
  DISPLAY_MODE_CHANGED: 'displayModeChanged',
  /** Fired when requesting a node transition */
  REQUEST_NODE_TRANSITION: 'requestNodeTransition'
} as const;

/**
 * Safely clear a timeout ref and set it to null
 * Prevents common pattern duplication throughout the codebase
 * @param ref - React ref holding a timeout ID
 */
export function clearTimeoutRef(ref: React.MutableRefObject<NodeJS.Timeout | null>): void {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}
