/**
 * Media API Routes
 * 
 * Endpoints for managing media assets (images and videos)
 * 
 * IMPORTANT: Route order matters in Express!
 * Specific routes (like /cleanup, /by-entities) must come BEFORE
 * wildcard routes (like /:id) to be matched correctly.
 */

import { Router } from 'express';
import { mediaService } from '../services/media';

const router = Router();

/**
 * GET /api/media
 * Get all media or filter by query params
 */
router.get('/', (req, res) => {
  try {
    const { type, entityId } = req.query;

    let media;
    
    if (type && (type === 'image' || type === 'video')) {
      media = mediaService.getMediaByType(type);
    } else if (entityId && typeof entityId === 'string') {
      media = mediaService.getMediaByEntityRef(entityId);
    } else {
      media = mediaService.getAllMedia();
    }

    res.json({ success: true, data: media });
  } catch (error) {
    console.error('Error getting media:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve media' 
    });
  }
});

/**
 * POST /api/media
 * Create new media
 */
router.post('/', (req, res) => {
  try {
    const { type, url, metadata, entityRefs, parentMedia, relatedMedia, transitionSequence } = req.body;

    if (!type || !url || !metadata) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: type, url, metadata' 
      });
    }

    const newMedia = mediaService.createMedia({
      type,
      url,
      metadata,
      entityRefs,
      parentMedia,
      relatedMedia,
      transitionSequence
    });

    res.status(201).json({ success: true, data: newMedia });
  } catch (error) {
    console.error('Error creating media:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create media' 
    });
  }
});

/**
 * POST /api/media/cleanup
 * Delete all unreferenced media
 * NOTE: Must be defined BEFORE /:id routes
 */
router.post('/cleanup', (req, res) => {
  try {
    const deletedIds = mediaService.cleanupUnreferencedMedia();

    res.json({ 
      success: true, 
      message: `Deleted ${deletedIds.length} unreferenced media items`,
      deletedIds 
    });
  } catch (error) {
    console.error('Error cleaning up media:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cleanup media' 
    });
  }
});

/**
 * GET /api/media/bulk
 * Get multiple media items by IDs in a single request
 * Used for bulk loading media on app startup
 * NOTE: Must be defined BEFORE /:id routes
 */
router.get('/bulk', (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids || typeof ids !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'ids query parameter required (comma-separated)' 
      });
    }
    
    const mediaIds = ids.split(',').filter(Boolean);
    
    if (mediaIds.length === 0) {
      return res.json({ success: true, data: {} });
    }
    
    // Collect all requested media items
    const mediaMap: Record<string, any> = {};
    
    mediaIds.forEach(id => {
      const media = mediaService.getMediaById(id);
      if (media) {
        mediaMap[id] = media;
      }
    });
    
    res.json({ success: true, data: mediaMap });
  } catch (error) {
    console.error('Error getting bulk media:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve bulk media' 
    });
  }
});

/**
 * DELETE /api/media/by-entities
 * Delete all media referenced by entity IDs
 * Used when deleting characters or world trees
 * NOTE: Must be defined BEFORE /:id routes
 */
router.delete('/by-entities', (req, res) => {
  try {
    const { entityIds } = req.body;
    
    if (!entityIds || !Array.isArray(entityIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'entityIds array required' 
      });
    }
    
    const deletedIds = mediaService.deleteMediaByEntityRefs(entityIds);
    
    res.json({
      success: true,
      message: `Deleted ${deletedIds.length} media items`,
      data: { deletedIds, count: deletedIds.length }
    });
  } catch (error) {
    console.error('Error deleting media by entity refs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete media' 
    });
  }
});

// ============================================
// WILDCARD ROUTES BELOW - ORDER MATTERS!
// These /:id routes must come AFTER specific routes
// ============================================

/**
 * GET /api/media/:id
 * Get media by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const media = mediaService.getMediaById(id);

    if (!media) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    res.json({ success: true, data: media });
  } catch (error) {
    console.error('Error getting media:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve media' 
    });
  }
});

/**
 * GET /api/media/:id/derivatives
 * Get derivative media for a parent
 */
router.get('/:id/derivatives', (req, res) => {
  try {
    const { id } = req.params;
    const derivatives = mediaService.getDerivatives(id);

    res.json({ success: true, data: derivatives });
  } catch (error) {
    console.error('Error getting derivatives:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve derivatives' 
    });
  }
});

/**
 * GET /api/media/:id/transitions
 * Get transition videos involving this media
 */
router.get('/:id/transitions', (req, res) => {
  try {
    const { id } = req.params;
    const transitions = mediaService.getTransitionVideos(id);

    res.json({ success: true, data: transitions });
  } catch (error) {
    console.error('Error getting transitions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve transitions' 
    });
  }
});

/**
 * PUT /api/media/:id
 * Update existing media
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedMedia = mediaService.updateMedia(id, updates);

    if (!updatedMedia) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    res.json({ success: true, data: updatedMedia });
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update media' 
    });
  }
});

/**
 * POST /api/media/:id/entity-refs
 * Add entity reference to media
 */
router.post('/:id/entity-refs', (req, res) => {
  try {
    const { id } = req.params;
    const { entityId } = req.body;

    if (!entityId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: entityId' 
      });
    }

    const updatedMedia = mediaService.addEntityRef(id, entityId);

    if (!updatedMedia) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    res.json({ success: true, data: updatedMedia });
  } catch (error) {
    console.error('Error adding entity reference:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add entity reference' 
    });
  }
});

/**
 * DELETE /api/media/:id/entity-refs/:entityId
 * Remove entity reference from media
 */
router.delete('/:id/entity-refs/:entityId', (req, res) => {
  try {
    const { id, entityId } = req.params;

    const updatedMedia = mediaService.removeEntityRef(id, entityId);

    if (!updatedMedia) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    res.json({ success: true, data: updatedMedia });
  } catch (error) {
    console.error('Error removing entity reference:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove entity reference' 
    });
  }
});

/**
 * DELETE /api/media/:id
 * Delete media by ID
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = mediaService.deleteMedia(id);

    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'Media not found' 
      });
    }

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete media' 
    });
  }
});

export default router;
