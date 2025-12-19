/**
 * Create Image Handler
 * POST /api/mzoo/navigation/create-image
 * Generate image for an existing node via /VIEW command
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import { storageService } from '../../../services/storage/storageService';
import { generateImage } from '../../../services/mzoo';
import { getNodeImagePrompt } from '../../../engine/nodeCreation/prompts/image';
import mediaService from '../../../services/media/mediaService';
import { sseService } from '../../../services/SSEService';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs, detectPerspectiveFromNode } from '../navigation';

export async function createImageHandler(req: Request, res: Response): Promise<void> {
  const { nodeId, flags } = req.body as {
    nodeId: string;
    flags: { createImage: boolean; backgroundTask: boolean };
  };

  // Validation
  if (!nodeId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: nodeId'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  // Generate unique operation ID
  const operationId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${operationId}`;

  console.log(`\n🖼️ [VIEW] Starting image generation pipeline...`);
  console.log(`[VIEW] Operation ID: ${operationId}`);
  console.log(`[VIEW] Node ID: ${nodeId}`);

  // Use pipeline config (single source of truth)
  const steps = getStepsForPipeline('view');
  pipelineConfigs.set(operationId, {
    pipelineType: 'view',
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
      // Step 1: Load node and generate image
      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
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

      console.log(`[VIEW] Found node: ${node.name} (type: ${node.type})`);

      // Generate image prompt from node DNA
      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
        message: 'Generating image...'
      });

      const perspective = detectPerspectiveFromNode(node);
      const imagePrompt = getNodeImagePrompt(node, perspective);
      
      console.log(`[VIEW] Image prompt: ${imagePrompt.substring(0, 100)}...`);

      // Call FLUX API
      const result = await generateImage(
        apiKey,
        imagePrompt,
        1,
        'landscape_16_9',
        'none'
      );

      if (result.error || !result.data?.images?.[0]?.url) {
        throw new Error(result.error || 'Failed to generate image');
      }

      const imageUrl = result.data.images[0].url;
      timings['generate'] = Date.now() - stageStart;
      console.log(`[VIEW] Image generated (${(timings['generate'] / 1000).toFixed(2)}s)`);

      // Save media entry and update node (silently, no separate step)
      // Create media entry
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imagePrompt,
          model: 'flux',
          width: 1920,
          height: 1080,
          aspectRatio: 'landscape_16_9'
        },
        entityRefs: [nodeId]
      });

      // Update node with primaryMedia
      node.primaryMedia = mediaEntry.id;
      node.imageUrl = imageUrl;
      worldsData.nodes[nodeId] = node;

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);
      
      // Log timing summary
      const totalTime = Date.now() - startTime;
      console.log(`\n[VIEW] ${operationId} completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Stage Timings:`);
      console.log(`    - Image Generation: ${(timings['generate'] / 1000).toFixed(2)}s`);
      console.log(`  Total: ${(totalTime / 1000).toFixed(2)}s\n`);

      // Send completion event with mediaId
      sseService.sendEvent(operationId, 'completed', {
        message: 'Image created successfully',
        node,
        imageUrl,
        mediaId: mediaEntry.id,
        timings
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
    } catch (error) {
      console.error(`\n❌ [VIEW ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create image'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}
