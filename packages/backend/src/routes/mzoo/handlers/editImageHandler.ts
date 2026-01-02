/**
 * Edit Image Handler
 * POST /api/mzoo/navigation/edit-image
 * Edit existing image for a node using FAL Flux 2 Turbo Edit
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import { storageService } from '../../../services/storage/storageService';
import { editImage } from '../../../services/mzoo';
import mediaService from '../../../services/media/mediaService';
import { sseService } from '../../../services/SSEService';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs } from '../navigation';

export async function editImageHandler(req: Request, res: Response): Promise<void> {
  const { nodeId, prompt, flags } = req.body as {
    nodeId: string;
    prompt: string;
    flags?: { createImage?: boolean; backgroundTask?: boolean };
  };

  // Validation
  if (!nodeId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: nodeId'
    });
    return;
  }

  if (!prompt) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: prompt'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  // Generate unique operation ID
  const operationId = `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${operationId}`;

  console.log(`\n✏️ [EDIT_IMAGE] Starting image edit pipeline...`);
  console.log(`[EDIT_IMAGE] Operation ID: ${operationId}`);
  console.log(`[EDIT_IMAGE] Node ID: ${nodeId}`);
  console.log(`[EDIT_IMAGE] Prompt: ${prompt}`);

  // Use edit pipeline config
  const steps = getStepsForPipeline('edit');
  pipelineConfigs.set(operationId, {
    pipelineType: 'edit',
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });

  // Return response immediately
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      nodeId
    }
  });

  // Run pipeline asynchronously
  (async () => {
    const startTime = Date.now();
    const timings: Record<string, number> = {};
    let stageStart = Date.now();
    
    try {
      // Step 1: Load node and get current image
      sseService.sendEvent(operationId, 'progress', {
        stage: 'load',
        message: 'Loading node data...'
      });

      const worldsData = await storageService.loadWorlds();
      if (!worldsData || !worldsData.nodes) {
        throw new Error('No worlds data found in storage');
      }

      const node = worldsData.nodes[nodeId];
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      console.log(`[EDIT_IMAGE] Found node: ${node.name} (type: ${node.type})`);

      // Get current image URL from media entry
      if (!node.primaryMedia) {
        throw new Error('Node has no image to edit');
      }

      const currentMedia = mediaService.getMediaById(node.primaryMedia);
      if (!currentMedia || !currentMedia.url) {
        throw new Error('Could not find current image for node');
      }

      const inputImageUrl = currentMedia.url;
      console.log(`[EDIT_IMAGE] Current image: ${inputImageUrl.substring(0, 50)}...`);

      // Step 2: Call edit API
      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
        message: 'Editing image...'
      });

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
      timings['generate'] = Date.now() - stageStart;
      console.log(`[EDIT_IMAGE] Image edited (${(timings['generate'] / 1000).toFixed(2)}s)`);

      // Save media entry and update node
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: prompt,
          model: 'fal-flux-2-turbo-edit',
          width: result.data.images[0].width || 1792,
          height: result.data.images[0].height || 1024,
          aspectRatio: 'landscape_16_9',
          editedFrom: node.primaryMedia
        },
        entityRefs: [nodeId],
        parentMedia: node.primaryMedia
      });

      // Update node with new primaryMedia
      node.primaryMedia = mediaEntry.id;
      node.imageUrl = imageUrl;
      worldsData.nodes[nodeId] = node;

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);
      
      // Log timing summary
      const totalTime = Date.now() - startTime;
      console.log(`\n[EDIT_IMAGE] ${operationId} completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Stage Timings:`);
      console.log(`    - Image Edit: ${(timings['generate'] / 1000).toFixed(2)}s`);
      console.log(`  Total: ${(totalTime / 1000).toFixed(2)}s\n`);

      // Send completion event with mediaId
      sseService.sendEvent(operationId, 'completed', {
        message: 'Image edited successfully',
        node,
        imageUrl,
        mediaId: mediaEntry.id,
        timings
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
    } catch (error) {
      console.error(`\n❌ [EDIT_IMAGE ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to edit image'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}
