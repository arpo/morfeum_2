/**
 * Scene and Camera Types
 * 
 * Types for scene perspective detection and camera styling.
 */

import type { NodeType } from './nodes';

// =============================================================================
// SCENE PERSPECTIVE
// =============================================================================

/**
 * Scene perspective for image generation
 * - interior: Fully enclosed space (room, hall, cave)
 * - exterior: Open outdoor space (park, plaza, garden)
 * - open-air: Semi-enclosed with open sky (balcony, terrace, rooftop)
 */
export type ScenePerspective = 'interior' | 'exterior' | 'open-air';

/**
 * Camera style based on node type
 */
export type CameraStyle = 'establishing' | 'overview' | 'ground' | 'intimate' | 'aerial';

// =============================================================================
// SCENE DETECTION
// =============================================================================

/**
 * Result from scene type detection
 */
export interface SceneAnalysis {
  /** Interior, exterior, or transitional */
  sceneType: ScenePerspective;
  
  /** Detected hierarchy depth */
  suggestedDepth: NodeType;
  
  /** Camera style for image generation */
  cameraStyle: CameraStyle;
  
  /** Whether input contains explicit elements (e.g., \"with stairs and machine\") */
  hasExplicitElements: boolean;
  
  /** Confidence score 0-1 */
  confidence: number;
}
