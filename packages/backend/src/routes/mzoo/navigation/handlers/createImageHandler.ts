/**
 * Create Image Handler
 * Handles /create-image command for generating images for existing nodes
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../../config';
import { sseService } from '../../../../services/SSEService';
import { storageService } from '../../../../services/storage/storageService';
import { generateImage } from '../../../../services/mzoo';
import { getNodeImagePrompt } from '../../../../engine/nodeCreation/prompts/image';
import { getResolvedNodeDNA } from '../../../../engine/hierarchyAnalysis/dnaMerge';
import mediaService from '../../../../services/media/mediaService';
import { pipelineConfigs, generateOperationId } from '../shared';
import { detectPerspectiveFromNode } from '../utils/perspectiveDetector';

/**
 * POST /api/mzoo/navigation/create-image
 * Generate image for an existing node via /create-image command
 */
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
  const operationId = generateOperationId('img');
  const eventsUrl = `/api/mzoo/navigation/events/${operationId}`;

  console.log(`\n🖼️ [CREATE-IMAGE] Starting image generation pipeline...`);
  console.log(`[CREATE-IMAGE] Operation ID: ${operationId}`);
  console.log(`[CREATE-IMAGE] Node ID: ${nodeId}`);

  // Store pipeline configuration for SSE initialization
  const steps = [
    { id: 'generate', name: 'Generating image', duration: 8000 },
    { id: 'save', name: 'Saving media', duration: 2000 }
  ];
  pipelineConfigs.set(operationId, {
    pipelineType: 'imageGeneration',
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
    try {
      // Step 1: Load node from storage
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

      console.log(`[CREATE-IMAGE] Found node: ${node.name} (type: ${node.type})`);

      // Step 2: Resolve ancestry DNA to fill null values from ancestors
      // This ensures the image prompt includes inherited attributes (architectural_tone, genre, etc.)
      const resolvedDNA = getResolvedNodeDNA(
        nodeId,
        worldsData.nodes || {},
        worldsData.worldTrees || []
      );

      // Create node with resolved DNA for image prompt generation
      const nodeWithResolvedDNA = resolvedDNA 
        ? { ...node, dna: resolvedDNA }
        : node;

      if (resolvedDNA) {
        console.log(`[CREATE-IMAGE] Using RESOLVED DNA with ancestry for image prompt`);
      }

      // Step 3: Generate image prompt from resolved node DNA
      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
        message: 'Generating image...'
      });

      const perspective = detectPerspectiveFromNode(node);
      const imagePrompt = getNodeImagePrompt(nodeWithResolvedDNA, perspective);
      
      console.log(`[CREATE-IMAGE] Image prompt: ${imagePrompt.substring(0, 100)}...`);

      // Step 3: Call FLUX API
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
      console.log(`[CREATE-IMAGE] Image generated: ${imageUrl.substring(0, 50)}...`);

      // Step 4: Create media entry and update node
      sseService.sendEvent(operationId, 'progress', {
        stage: 'save',
        message: 'Saving image...'
      });

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
      
      console.log(`[CREATE-IMAGE] Media entry created: ${mediaEntry.id}`);

      // Update node with primaryMedia (not just imageUrl)
      node.primaryMedia = mediaEntry.id;
      node.imageUrl = imageUrl; // Keep for backward compatibility
      worldsData.nodes[nodeId] = node;

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);
      console.log(`[CREATE-IMAGE] Node updated with primaryMedia: ${mediaEntry.id}`);

      // Send completion event with mediaId
      sseService.sendEvent(operationId, 'completed', {
        message: 'Image created successfully',
        node,
        imageUrl,
        mediaId: mediaEntry.id
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
    } catch (error) {
      console.error(`\n❌ [CREATE-IMAGE ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create image'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}
