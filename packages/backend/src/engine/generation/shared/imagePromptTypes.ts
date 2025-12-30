/**
 * Image Prompt Structure Types
 * 
 * Structured format for image prompts enabling:
 * - Layer-based scene composition (background → midground → foreground)
 * - Character placement in specific layers
 * - Creature mode control (none/allow/populate)
 * - Clean separation of scene elements for reuse
 */

/**
 * Creature mode for scene population
 * - 'none': NoCreatures filter applied (default for locations)
 * - 'allow': No filter, people can appear naturally
 * - 'populate': Active crowd directive added
 */
export type CreatureMode = 'none' | 'allow' | 'populate';

/**
 * Structured image prompt for scene composition
 * 
 * Each layer describes elements at different depths:
 * - background: Distant elements, sky, horizon, environmental context
 * - midground: Main subject matter, central structures, primary focus
 * - foreground: Closest elements, details, objects, character placement area
 */
export interface ImagePromptStructure {
  /** Distant elements: sky, horizon, mountains, environmental context */
  background: string;
  
  /** Central focus: main structures, primary subject matter */
  midground: string;
  
  /** Closest elements: details, objects, furniture, character placement */
  foreground: string;
  
  /** Light direction, quality, and how it affects each layer */
  lighting: string;
  
  /** Mood, tone, atmospheric effects, style qualifiers */
  atmosphere: string;
  
  /** CRITICAL directives for FLUX (shape constraints, exterior views, etc.) */
  constraints: string[];
  
  /** Negative prompts (NoCreatures filter content when enabled) */
  negatives: string[];
  
  /** Camera angle description */
  camera?: string;
  
  /** Lens specification */
  lens?: string;
}

/**
 * Options for assembling the final prompt string
 */
export interface AssemblePromptOptions {
  /** 
   * Creature mode for scene population
   * - 'none' (default): NoCreatures filter applied
   * - 'allow': No filter, people can appear
   * - 'populate': Active crowd directive added
   */
  creatureMode?: CreatureMode;
  
  /** Include Morfeum style wrappers (morfeumVibes, qualityPrompt) */
  includeMorfeumStyle?: boolean;
  
  /** Camera configuration to append */
  cameraConfig?: string;
}
