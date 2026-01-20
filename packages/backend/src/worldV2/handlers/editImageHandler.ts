/**
 * EDIT_IMAGE V2 Route Handler
 * 
 * Handles the /EDIT_IMAGE command for editing existing node images.
 * Supports all node types: host, region, location, niche, container, space, view
 * 
 * Flow:
 * 1. Get current node and its source image
 * 2. Call image edit API with user's edit prompt
 * 3. Save new media entry with reference to original
 * 4. Update node's primaryMedia
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, getModelClass } from '../../config';
import { editImage } from '../../services/mzoo';
import { storageService } from '../../services/storage/storageService';
import mediaService from '../../services/media/mediaService';
import {
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  sendProgress,
  sendCompletion,
  sendError,
  createViewNode
} from '../utils/routeUtils';

export const editImageHandler = asyncHandler(async (req: Request, res: Response) => {
  const { nodeId, prompt } = req.body as { nodeId: string; prompt: string };

  // Validation
  if (!nodeId || !prompt || prompt.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: nodeId and prompt'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;
  if (!apiKey) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Missing API key'
    });
    return;
  }

  // Generate unique operation ID
  const operationId = generateOperationId('edit');
  const eventsUrl = setupPipeline(operationId, 'v2Edit');

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'EDIT_IMAGE'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Load node and get current image
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'loading', 'Loading node data...');

      const worldsData = await storageService.loadWorlds();
      if (!worldsData || !worldsData.nodes) {
        throw new Error('No worlds data found in storage');
      }

      const node = worldsData.nodes[nodeId];
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      // Get current image URL from media entry
      if (!node.primaryMedia) {
        throw new Error('Node has no image to edit. Generate an image first using /DISPLAY');
      }

      const currentMedia = mediaService.getMediaById(node.primaryMedia);
      if (!currentMedia || !currentMedia.url) {
        throw new Error('Could not find current image for node');
      }

      const inputImageUrl = currentMedia.url;

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 2: Call edit API
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'editing', 'Editing image...');

      const result = await editImage(
        apiKey,
        prompt,
        inputImageUrl,
        1,
        'landscape_16_9',
        2.5,
        'jpeg',
        false
      );

      if (result.error || !result.data?.images?.[0]?.url) {
        throw new Error(result.error || 'Failed to edit image');
      }

      const imageUrl = result.data.images[0].url;

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Save media entry and create view node (like LOOK command)
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'saving', 'Saving changes...');

      // Preserve promptLayers from original media if available
      const originalPromptLayers = currentMedia.metadata?.promptLayers;

      // Create media entry for the edited image
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: prompt,
          promptLayers: originalPromptLayers, // Preserve for navigation continuity
          promptData: {
            command: 'EDIT_IMAGE',
            editPrompt: prompt
          },
          model: 'fal-flux-2-turbo-edit',
          width: result.data.images[0].width || 1792,
          height: result.data.images[0].height || 1024,
          aspectRatio: 'landscape_16_9',
          editedFrom: node.primaryMedia
        },
        entityRefs: [], // Will be updated after view node creation
        parentMedia: node.primaryMedia
      });

      // Create a view node for the edited image (same pattern as LOOK)
      // This preserves the original node's image while adding the edit as a child view
      const viewName = `Edited: ${prompt.slice(0, 40)}${prompt.length > 40 ? '...' : ''}`;
      const viewNode = createViewNode(
        worldsData,
        nodeId,
        viewName,
        `Edit: ${prompt}`,
        mediaEntry.id
      );

      // Update media entry with view node reference
      mediaService.updateMedia(mediaEntry.id, { entityRefs: [viewNode.id] });

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);

      // Send completion with modelClass (not actual model name for privacy)
      const modelClass = getModelClass('fal-flux-2-turbo-edit');

      sendCompletion(operationId, {
        message: 'Image edited successfully',
        view: {
          id: viewNode.id,
          name: viewNode.name,
          type: viewNode.type,
          primaryMedia: mediaEntry.id
        },
        node: {
          id: nodeId,
          name: node.name,
          type: node.type
        },
        imageUrl,
        mediaId: mediaEntry.id,
        modelClass
      });

    } catch (error) {
      sendError(operationId, error);
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
