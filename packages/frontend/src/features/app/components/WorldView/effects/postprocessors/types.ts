/**
 * Post-Processor Types
 * Image displacement and distortion effects
 */

export type PostProcessorType = 'heatwave' | 'underwater' | 'glitch' | 'dream';

export interface PostProcessorConfig {
  enabled: boolean;
  type: PostProcessorType;
  intensity: number;      // 0-1, strength of the effect
  speed: number;          // Animation speed multiplier
  frequency: number;      // Wave frequency (higher = more waves)
  direction: { x: number; y: number };  // Primary direction of effect
}

export interface PostProcessorPreset {
  name: string;
  config: PostProcessorConfig;
}
