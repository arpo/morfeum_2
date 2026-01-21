/**
 * Media System Types
 * 
 * Defines the structure for all media assets (images, videos)
 * and their relationships.
 */

export type MediaType = 'image' | 'video';

export interface MediaMetadata {
  prompt: string;
  originalPrompt?: string;  // User's original input before enhancement
  model: string;
  width?: number;
  height?: number;
  // Video-specific
  duration?: number;
  fps?: number;
  codec?: string;
  // Flexible for future additions
  // Note: 'seed' object is deprecated - use originalPrompt instead
  [key: string]: any;
}

export interface RelatedMedia {
  versions?: string[];       // Different versions (upscaled, etc.)
  derivatives?: string[];    // Depth maps, normal maps, etc.
  sourceFor?: string[];      // Videos created from this image
  transitionVideos?: string[]; // Transition videos this media participates in
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;               // Active/display URL (original or upscaled)
  createdAt: string;
  metadata: MediaMetadata;
  entityRefs: string[];      // Entity IDs that reference this media
  parentMedia?: string;      // If derived from another media
  relatedMedia?: RelatedMedia;
  // For transition videos only
  transitionSequence?: string[]; // Array of media IDs in sequence
  // All URL variants for this media (flat structure)
  urls?: {
    original?: string;       // Original generated image
    upscaled?: string;       // Upscaled version
    depthMap?: string;       // Depth map
  };
}

export interface MediaDatabase {
  media: {
    [mediaId: string]: MediaItem;
  };
}

export interface CreateMediaInput {
  type: MediaType;
  url: string;
  metadata: MediaMetadata;
  entityRefs?: string[];
  parentMedia?: string;
  relatedMedia?: RelatedMedia;
  transitionSequence?: string[];
}

export interface UpdateMediaInput {
  url?: string;
  metadata?: Partial<MediaMetadata>;
  entityRefs?: string[];
  parentMedia?: string;
  relatedMedia?: RelatedMedia;
  transitionSequence?: string[];
}
