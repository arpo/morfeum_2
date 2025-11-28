/**
 * Media API Routes
 * IMPORTANT: Route order matters! Specific routes must come BEFORE wildcard /:id routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { mediaService } from '../services/media';

const router = Router();

// Async handler wrapper to reduce boilerplate
const asyncHandler = (fn: (req: Request, res: Response) => any) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res)).catch(next);

// Error handler middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Media route error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// GET /api/media - Get all or filtered media
router.get('/', asyncHandler((req, res) => {
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
}));

// POST /api/media - Create new media
router.post('/', asyncHandler((req, res) => {
  const { type, url, metadata, entityRefs, parentMedia, relatedMedia, transitionSequence } = req.body;
  if (!type || !url || !metadata) {
    return res.status(400).json({ success: false, error: 'Missing required fields: type, url, metadata' });
  }
  const newMedia = mediaService.createMedia({ type, url, metadata, entityRefs, parentMedia, relatedMedia, transitionSequence });
  res.status(201).json({ success: true, data: newMedia });
}));

// POST /api/media/cleanup - Delete unreferenced media (must be before /:id)
router.post('/cleanup', asyncHandler((req, res) => {
  const deletedIds = mediaService.cleanupUnreferencedMedia();
  res.json({ success: true, message: `Deleted ${deletedIds.length} unreferenced media items`, deletedIds });
}));

// GET /api/media/bulk - Bulk load media by IDs (must be before /:id)
router.get('/bulk', asyncHandler((req, res) => {
  const { ids } = req.query;
  if (!ids || typeof ids !== 'string') {
    return res.status(400).json({ success: false, error: 'ids query parameter required (comma-separated)' });
  }
  const mediaIds = ids.split(',').filter(Boolean);
  if (mediaIds.length === 0) return res.json({ success: true, data: {} });
  
  const mediaMap: Record<string, any> = {};
  mediaIds.forEach(id => {
    const media = mediaService.getMediaById(id);
    if (media) mediaMap[id] = media;
  });
  res.json({ success: true, data: mediaMap });
}));

// DELETE /api/media/by-entities - Delete media by entity refs (must be before /:id)
router.delete('/by-entities', asyncHandler((req, res) => {
  const { entityIds } = req.body;
  if (!entityIds || !Array.isArray(entityIds)) {
    return res.status(400).json({ success: false, error: 'entityIds array required' });
  }
  const deletedIds = mediaService.deleteMediaByEntityRefs(entityIds);
  res.json({ success: true, message: `Deleted ${deletedIds.length} media items`, data: { deletedIds, count: deletedIds.length } });
}));

// ============ WILDCARD ROUTES (/:id) - Must be AFTER specific routes ============

// GET /api/media/:id - Get single media
router.get('/:id', asyncHandler((req, res) => {
  const media = mediaService.getMediaById(req.params.id);
  if (!media) return res.status(404).json({ success: false, error: 'Media not found' });
  res.json({ success: true, data: media });
}));

// GET /api/media/:id/derivatives - Get derivatives
router.get('/:id/derivatives', asyncHandler((req, res) => {
  res.json({ success: true, data: mediaService.getDerivatives(req.params.id) });
}));

// GET /api/media/:id/transitions - Get transitions
router.get('/:id/transitions', asyncHandler((req, res) => {
  res.json({ success: true, data: mediaService.getTransitionVideos(req.params.id) });
}));

// PUT /api/media/:id - Update media
router.put('/:id', asyncHandler((req, res) => {
  const updatedMedia = mediaService.updateMedia(req.params.id, req.body);
  if (!updatedMedia) return res.status(404).json({ success: false, error: 'Media not found' });
  res.json({ success: true, data: updatedMedia });
}));

// POST /api/media/:id/entity-refs - Add entity reference
router.post('/:id/entity-refs', asyncHandler((req, res) => {
  const { entityId } = req.body;
  if (!entityId) return res.status(400).json({ success: false, error: 'Missing required field: entityId' });
  const updatedMedia = mediaService.addEntityRef(req.params.id, entityId);
  if (!updatedMedia) return res.status(404).json({ success: false, error: 'Media not found' });
  res.json({ success: true, data: updatedMedia });
}));

// DELETE /api/media/:id/entity-refs/:entityId - Remove entity reference
router.delete('/:id/entity-refs/:entityId', asyncHandler((req, res) => {
  const updatedMedia = mediaService.removeEntityRef(req.params.id, req.params.entityId);
  if (!updatedMedia) return res.status(404).json({ success: false, error: 'Media not found' });
  res.json({ success: true, data: updatedMedia });
}));

// DELETE /api/media/:id - Delete media
router.delete('/:id', asyncHandler((req, res) => {
  const success = mediaService.deleteMedia(req.params.id);
  if (!success) return res.status(404).json({ success: false, error: 'Media not found' });
  res.json({ success: true, message: 'Media deleted successfully' });
}));

export default router;
