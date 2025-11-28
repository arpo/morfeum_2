/**
 * Media Service
 * 
 * Handles CRUD operations for media assets (images and videos)
 * Stores data in temp-db/media.json
 */

import fs from 'fs';
import path from 'path';
import { 
  MediaDatabase, 
  MediaItem, 
  CreateMediaInput, 
  UpdateMediaInput 
} from './types';

const MEDIA_FILE = path.join(__dirname, '../../../temp-db/media.json');

class MediaService {
  /**
   * Read media database from file
   */
  private readMediaDB(): MediaDatabase {
    try {
      const data = fs.readFileSync(MEDIA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading media.json:', error);
      return { media: {} };
    }
  }

  /**
   * Write media database to file
   */
  private writeMediaDB(db: MediaDatabase): void {
    try {
      fs.writeFileSync(MEDIA_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing media.json:', error);
      throw new Error('Failed to save media data');
    }
  }

  /**
   * Generate unique media ID
   */
  private generateMediaId(): string {
    return `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all media
   */
  getAllMedia(): MediaItem[] {
    const db = this.readMediaDB();
    return Object.values(db.media);
  }

  /**
   * Get media by ID
   */
  getMediaById(id: string): MediaItem | null {
    const db = this.readMediaDB();
    return db.media[id] || null;
  }

  /**
   * Get media by entity reference
   */
  getMediaByEntityRef(entityId: string): MediaItem[] {
    const db = this.readMediaDB();
    return Object.values(db.media).filter(media => 
      media.entityRefs.includes(entityId)
    );
  }

  /**
   * Get media by type
   */
  getMediaByType(type: 'image' | 'video'): MediaItem[] {
    const db = this.readMediaDB();
    return Object.values(db.media).filter(media => media.type === type);
  }

  /**
   * Get derivative media for a parent
   */
  getDerivatives(parentMediaId: string): MediaItem[] {
    const db = this.readMediaDB();
    return Object.values(db.media).filter(media => 
      media.parentMedia === parentMediaId
    );
  }

  /**
   * Get transition videos involving a media item
   */
  getTransitionVideos(mediaId: string): MediaItem[] {
    const db = this.readMediaDB();
    return Object.values(db.media).filter(media => 
      media.transitionSequence?.includes(mediaId)
    );
  }

  /**
   * Create new media
   */
  createMedia(input: CreateMediaInput): MediaItem {
    const db = this.readMediaDB();
    
    const newMedia: MediaItem = {
      id: this.generateMediaId(),
      type: input.type,
      url: input.url,
      createdAt: new Date().toISOString(),
      metadata: input.metadata,
      entityRefs: input.entityRefs || [],
      ...(input.parentMedia && { parentMedia: input.parentMedia }),
      ...(input.relatedMedia && { relatedMedia: input.relatedMedia }),
      ...(input.transitionSequence && { transitionSequence: input.transitionSequence })
    };

    db.media[newMedia.id] = newMedia;
    this.writeMediaDB(db);

    return newMedia;
  }

  /**
   * Update existing media
   */
  updateMedia(id: string, updates: UpdateMediaInput): MediaItem | null {
    const db = this.readMediaDB();
    const media = db.media[id];

    if (!media) {
      return null;
    }

    // Merge updates
    if (updates.url) media.url = updates.url;
    if (updates.metadata) {
      media.metadata = { ...media.metadata, ...updates.metadata };
    }
    if (updates.entityRefs) media.entityRefs = updates.entityRefs;
    if (updates.parentMedia !== undefined) media.parentMedia = updates.parentMedia;
    if (updates.relatedMedia) {
      media.relatedMedia = { ...media.relatedMedia, ...updates.relatedMedia };
    }
    if (updates.transitionSequence) media.transitionSequence = updates.transitionSequence;

    db.media[id] = media;
    this.writeMediaDB(db);

    return media;
  }

  /**
   * Add entity reference to media
   */
  addEntityRef(mediaId: string, entityId: string): MediaItem | null {
    const db = this.readMediaDB();
    const media = db.media[mediaId];

    if (!media) {
      return null;
    }

    if (!media.entityRefs.includes(entityId)) {
      media.entityRefs.push(entityId);
      db.media[mediaId] = media;
      this.writeMediaDB(db);
    }

    return media;
  }

  /**
   * Remove entity reference from media
   */
  removeEntityRef(mediaId: string, entityId: string): MediaItem | null {
    const db = this.readMediaDB();
    const media = db.media[mediaId];

    if (!media) {
      return null;
    }

    media.entityRefs = media.entityRefs.filter(id => id !== entityId);
    db.media[mediaId] = media;
    this.writeMediaDB(db);

    return media;
  }

  /**
   * Delete media by ID
   */
  deleteMedia(id: string): boolean {
    const db = this.readMediaDB();

    if (!db.media[id]) {
      return false;
    }

    delete db.media[id];
    this.writeMediaDB(db);

    return true;
  }

  /**
   * Delete all media not referenced by any entity
   */
  cleanupUnreferencedMedia(): string[] {
    const db = this.readMediaDB();
    const deletedIds: string[] = [];

    for (const [id, media] of Object.entries(db.media)) {
      if (media.entityRefs.length === 0) {
        delete db.media[id];
        deletedIds.push(id);
      }
    }

    if (deletedIds.length > 0) {
      this.writeMediaDB(db);
    }

    return deletedIds;
  }

  /**
   * Delete all media referenced by entity IDs
   * Used when deleting characters or world trees
   */
  deleteMediaByEntityRefs(entityIds: string[]): string[] {
    const db = this.readMediaDB();
    const deletedIds: string[] = [];
    
    for (const [id, media] of Object.entries(db.media)) {
      // Check if media is referenced by any of the entity IDs
      const hasRef = media.entityRefs.some(ref => entityIds.includes(ref));
      if (hasRef) {
        delete db.media[id];
        deletedIds.push(id);
      }
    }
    
    if (deletedIds.length > 0) {
      this.writeMediaDB(db);
    }
    
    return deletedIds;
  }
}

export default new MediaService();
