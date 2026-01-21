/**
 * REDRAW Command Handler
 * 
 * Wrapper command that builds an atmosphere-based edit prompt and delegates to editImage logic.
 * Uses host's timeOfDay and weather to construct the transformation prompt.
 * 
 * Flow:
 * 1. Get node and find parent host
 * 2. Build edit prompt from host's timeOfDay + weather + optional trailingCommand
 * 3. Generate descriptive view name ("Night view", "Stormy dusk", etc.)
 * 4. Execute same editImage pipeline
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, getModelClass } from '../../config';
import { editImage } from '../../services/mzoo';
import { storageService } from '../../services/storage/storageService';
import mediaService from '../../services/media/mediaService';
import { PipelineHelper } from '../../engine/pipelines/shared/pipelineHelpers';
import {
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  createViewNode
} from '../utils/routeUtils';

/**
 * Find host node by walking up the tree from any node
 */
function findHostForNode(worldsData: any, nodeId: string): any | null {
  // First check if the node itself is a host
  const node = worldsData.nodes[nodeId];
  if (!node) return null;
  if (node.type === 'host') return node;

  // For view nodes, use parentId to find actual parent
  if (node.type === 'view' && node.parentId) {
    return findHostForNode(worldsData, node.parentId);
  }

  // Walk up tree to find the host
  for (const hostTree of worldsData.worldTrees) {
    if (findNodeInTree(hostTree, nodeId)) {
      return worldsData.nodes[hostTree.id];
    }
  }
  return null;
}

/**
 * Recursively search for nodeId in a tree structure
 */
function findNodeInTree(tree: any, nodeId: string): boolean {
  if (tree.id === nodeId) return true;
  if (tree.children) {
    for (const child of tree.children) {
      if (findNodeInTree(child, nodeId)) return true;
    }
  }
  return false;
}

/**
 * Build descriptive view name from conditions
 * Examples: "Night view", "Rainy morning", "Stormy dusk"
 */
function buildConditionViewName(timeOfDay?: string, weather?: string): string {
  const parts: string[] = [];
  
  if (weather) {
    // Capitalize first letter
    parts.push(weather.charAt(0).toUpperCase() + weather.slice(1).toLowerCase());
  }
  
  if (timeOfDay) {
    // Convert snake_case to readable format
    const timeFormatted = timeOfDay.replace(/_/g, ' ');
    parts.push(timeFormatted);
  }
  
  if (parts.length === 0) {
    return 'Redrawn view';
  }
  
  return parts.join(' ') + ' view';
}

/**
 * Build the edit prompt for atmosphere transformation
 */
function buildRedrawPrompt(timeOfDay?: string, weather?: string, trailingCommand?: string): string {
  const parts: string[] = [];
  
  if (timeOfDay) {
    const timeFormatted = timeOfDay.replace(/_/g, ' ');
    parts.push(`Transform this scene to ${timeFormatted} lighting conditions`);
  }
  
  if (weather) {
    if (parts.length > 0) {
      parts.push(`with ${weather} weather`);
    } else {
      parts.push(`Add ${weather} weather to this scene`);
    }
  }
  
  // Add trailing command if provided
  if (trailingCommand && trailingCommand.trim()) {
    if (parts.length > 0) {
      parts.push(`. ${trailingCommand.trim()}`);
    } else {
      parts.push(trailingCommand.trim());
    }
  }
  
  if (parts.length === 0) {
    return 'Refresh and enhance this scene';
  }
  
  return parts.join(' ');
}

export const redrawHandler = asyncHandler(async (req: Request, res: Response) => {
  const { nodeId, trailingCommand } = req.body as { nodeId: string; trailingCommand?: string };

  // Validation
  if (!nodeId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: nodeId'
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
  const operationId = generateOperationId('redraw');
  const eventsUrl = setupPipeline(operationId, 'v2Edit'); // Reuse v2Edit pipeline

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'REDRAW'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    // Create pipeline helper for timing and SSE events
    const pipeline = new PipelineHelper(operationId, 'REDRAW', 'v2Edit');
    
    try {
      pipeline.started('Starting scene redraw...');

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Load node, find host, get conditions
      // ═══════════════════════════════════════════════════════════════════════
      pipeline.startStage('loading', 'Loading node and host data...');

      const worldsData = await storageService.loadWorlds();
      if (!worldsData || !worldsData.nodes) {
        throw new Error('No worlds data found in storage');
      }

      const node = worldsData.nodes[nodeId];
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      // Find parent host to get timeOfDay and weather
      const host = findHostForNode(worldsData, nodeId);
      if (!host) {
        throw new Error('Could not find parent host for node');
      }

      const timeOfDay = host.timeOfDay;
      const weather = host.weather;

      // Build the edit prompt and view name
      const prompt = buildRedrawPrompt(timeOfDay, weather, trailingCommand);
      const viewName = buildConditionViewName(timeOfDay, weather);

      // Get current image URL from media entry
      if (!node.primaryMedia) {
        throw new Error('Node has no image to redraw. Generate an image first using /DISPLAY');
      }

      const currentMedia = mediaService.getMediaById(node.primaryMedia);
      if (!currentMedia || !currentMedia.url) {
        throw new Error('Could not find current image for node');
      }

      const inputImageUrl = currentMedia.url;
      pipeline.completeStage('loading', 'Node and host data loaded');

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 2: Call edit API (same as editImageHandler)
      // ═══════════════════════════════════════════════════════════════════════
      pipeline.startStage('editing', `Redrawing: ${prompt.slice(0, 50)}...`);

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
        throw new Error(result.error || 'Failed to redraw image');
      }

      const imageUrl = result.data.images[0].url;
      pipeline.completeStage('editing', 'Image redrawn');

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Save media entry and create view node
      // ═══════════════════════════════════════════════════════════════════════
      pipeline.startStage('saving', 'Saving changes...');

      // Preserve promptLayers from original media if available
      const originalPromptLayers = currentMedia.metadata?.promptLayers;

      // Create media entry for the redrawn image
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: prompt,
          promptLayers: originalPromptLayers,
          promptData: {
            command: 'REDRAW',
            editPrompt: prompt,
            timeOfDay,
            weather,
            trailingCommand
          },
          model: 'fal-flux-2-turbo-edit',
          width: result.data.images[0].width || 1792,
          height: result.data.images[0].height || 1024,
          aspectRatio: 'landscape_16_9',
          editedFrom: node.primaryMedia
        },
        entityRefs: [],
        parentMedia: node.primaryMedia
      });

      // Create a view node for the redrawn image
      const viewNode = createViewNode(
        worldsData,
        nodeId,
        viewName,
        `Redraw: ${prompt}`,
        mediaEntry.id
      );

      // Update media entry with view node reference
      mediaService.updateMedia(mediaEntry.id, { entityRefs: [viewNode.id] });

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);
      pipeline.completeStage('saving', 'Changes saved');

      // Send completion
      const modelClass = getModelClass('fal-flux-2-turbo-edit');

      pipeline.completed('Scene redrawn successfully', {
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
        modelClass,
        conditions: {
          timeOfDay,
          weather
        }
      });

    } catch (error) {
      pipeline.error(error instanceof Error ? error : new Error(String(error)));
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
