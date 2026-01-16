/**
 * LOOK Route Handler
 * 
 * Handles the /LOOK command for changing viewpoint within the same space.
 * Creates a view node (child of current location/space) with a new camera angle.
 * 
 * Flow:
 * 1. Get current node and its source image + promptLayers
 * 2. Generate camera instruction via LLM (using Morfeum Camera Expert prompt)
 * 3. Build image edit prompt for camera movement
 * 4. Call image edit API
 * 5. Save view node with reference to edited image
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS, getModelClass } from '../../config';
import { generateText, editImage, hasMzooData } from '../../services/mzoo';
import { buildLookPrompt, parseLookResponse } from '../prompts/look';
import { buildLookImageEditPrompt } from '../prompts/imageEditPrompt';
import { storageService } from '../../services/storage/storageService';
import mediaService from '../../services/media/mediaService';
import {
  generateId,
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  sendProgress,
  sendCompletion,
  sendError
} from '../utils/routeUtils';
import type { Host, TimeOfDay } from '../types';
import type { ImagePromptLayers } from '../display/imagePromptGenerator';

/**
 * View node structure
 * Represents a different camera angle of the same physical space
 */
export interface ViewNode {
  id: string;
  type: 'view';
  name: string;
  slug: string;
  description: string;
  parentId: string;
}

/**
 * Find node ancestry chain for context
 * Returns host info and current node details
 */
function findNodeAncestry(
  worldsData: any,
  nodeId: string
): {
  host?: Host;
  currentNode: any;
  hostWeather?: string;
  hostTimeOfDay?: TimeOfDay;
} | null {
  const currentNode = worldsData.nodes[nodeId];
  if (!currentNode) return null;

  // Find the world tree containing this node
  for (const hostTree of worldsData.worldTrees) {
    const hostNode = worldsData.nodes[hostTree.id] as Host;
    if (!hostNode) continue;

    // Search for the node in this tree
    const path = findNodePath(hostTree, nodeId);
    if (path) {
      return {
        host: hostNode,
        currentNode,
        hostWeather: hostNode.weather,
        hostTimeOfDay: hostNode.timeOfDay
      };
    }
  }

  return null;
}

/**
 * Find path from root to target node in tree
 */
function findNodePath(tree: any, targetId: string, path: string[] = []): string[] | null {
  if (tree.id === targetId) {
    return path;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const result = findNodePath(child, targetId, [...path, child.id]);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Get source image URL and promptLayers for a node (from primaryMedia reference)
 */
function getNodeMediaInfo(worldsData: any, nodeId: string): { 
  imageUrl: string | null; 
  promptLayers: ImagePromptLayers | null;
  mediaId: string | null;
} {
  const node = worldsData.nodes[nodeId];
  if (!node?.primaryMedia) {
    return { imageUrl: null, promptLayers: null, mediaId: null };
  }

  const media = mediaService.getMediaById(node.primaryMedia);
  if (!media) {
    return { imageUrl: null, promptLayers: null, mediaId: null };
  }

  return {
    imageUrl: media.url || null,
    promptLayers: media.metadata?.promptLayers || null,
    mediaId: node.primaryMedia
  };
}

/**
 * Find tree entry for a node (to add children)
 */
function findTreeEntry(tree: any, nodeId: string): any | null {
  if (tree.id === nodeId) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const result = findTreeEntry(child, nodeId);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Create fallback promptLayers when source doesn't have them
 */
function createFallbackPromptLayers(node: any): ImagePromptLayers {
  return {
    name: node.name || 'Unknown Location',
    description: node.description || 'A location in the world',
    background: 'Distant surroundings',
    midground: 'Main features and structures',
    foreground: 'Ground surface and immediate environment',
    lighting: 'Ambient lighting',
    atmosphere: 'Scene atmosphere'
  };
}

/**
 * Generate a slug from view name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const lookHandler = asyncHandler(async (req: Request, res: Response) => {
  const { nodeId, instruction } = req.body as { nodeId: string; instruction: string };

  // Validation
  if (!nodeId || !instruction || instruction.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: nodeId and instruction'
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
  const operationId = generateOperationId('look');
  const eventsUrl = setupPipeline(operationId, 'v2Look');

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'LOOK'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Analyze current location and get source image context
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'analyzing', 'Analyzing current view...');

      const worldsData = await storageService.loadWorlds();
      if (!worldsData) {
        throw new Error('No worlds data found');
      }

      // Find ancestry chain for context
      const ancestry = findNodeAncestry(worldsData, nodeId);
      if (!ancestry) {
        throw new Error(`Node ${nodeId} not found in any world tree`);
      }

      // Get source image and promptLayers from current node's media
      const { imageUrl: sourceImageUrl, promptLayers: sourcePromptLayers, mediaId: sourceMediaId } = getNodeMediaInfo(worldsData, nodeId);
      
      if (!sourceImageUrl) {
        throw new Error(`Node ${nodeId} has no image. Generate an image first using /DISPLAY`);
      }

      // Use source promptLayers if available, otherwise create fallback
      const effectiveSourcePromptLayers = sourcePromptLayers || createFallbackPromptLayers(ancestry.currentNode);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 2: Generate camera instruction via LLM
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'camera', 'Planning camera movement...');

      const lookPrompt = buildLookPrompt(instruction, {
        name: ancestry.currentNode.name,
        description: ancestry.currentNode.description,
        sourcePromptLayers: effectiveSourcePromptLayers
      });

      const llmResult = await generateText(
        apiKey,
        [{ role: 'user', content: lookPrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(llmResult)) {
        throw new Error(llmResult.error || 'Failed to generate camera instruction');
      }

      const lookResponse = parseLookResponse(llmResult.data.text);

      // DEBUG: Log LLM response
      console.log('\n═══════════════════════════════════════════════════════════════════════');
      console.log('LOOK COMMAND DEBUG - LLM Response:');
      console.log(JSON.stringify(lookResponse, null, 2));
      console.log('═══════════════════════════════════════════════════════════════════════\n');

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Generate edited image for the new view
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'image', 'Generating new view...');

      // Build image edit prompt using the camera instruction
      const imageEditPrompt = buildLookImageEditPrompt(
        effectiveSourcePromptLayers,
        lookResponse,
        ancestry.currentNode.name,
        ancestry.hostWeather,
        ancestry.hostTimeOfDay
      );

      // DEBUG: Log final image edit prompt
      console.log('\n═══════════════════════════════════════════════════════════════════════');
      console.log('LOOK COMMAND DEBUG - Image Edit Prompt:');
      console.log(imageEditPrompt);
      console.log('═══════════════════════════════════════════════════════════════════════\n');

      // Call image edit API
      const imageResult = await editImage(
        apiKey,
        imageEditPrompt,
        sourceImageUrl
      );

      if (imageResult.error || !imageResult.data?.images?.[0]?.url) {
        throw new Error(imageResult.error || 'Failed to generate image');
      }

      const imageUrl = imageResult.data.images[0].url;

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 4: Save view node and image
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'saving', 'Saving view...');

      // Create view node
      const viewNode: ViewNode = {
        id: generateId(),
        type: 'view',
        name: lookResponse.viewName,
        slug: generateSlug(lookResponse.viewName),
        description: `View: ${lookResponse.reveal}`,
        parentId: nodeId
      };

      // Save view node
      worldsData.nodes[viewNode.id] = viewNode;

      // Create media entry for view image
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imageEditPrompt,
          // View doesn't need new promptLayers - it's the same space, different angle
          // We still reference the parent's promptLayers for continuity
          promptLayers: effectiveSourcePromptLayers,
          promptData: {
            command: 'LOOK'
          },
          model: 'fal-flux-2-turbo-edit',
          width: 1920,
          height: 1080,
          aspectRatio: 'landscape_16_9'
        },
        entityRefs: [viewNode.id],
        parentMedia: sourceMediaId || undefined
      });

      // Update view node with primaryMedia reference
      (worldsData.nodes[viewNode.id] as any).primaryMedia = mediaEntry.id;

      // Update world tree structure - add view as child of current node
      for (const hostTree of worldsData.worldTrees) {
        const parentEntry = findTreeEntry(hostTree, nodeId);
        if (parentEntry) {
          if (!parentEntry.children) {
            parentEntry.children = [];
          }
          parentEntry.children.push({
            id: viewNode.id,
            type: 'view',
            children: []
          });
          break;
        }
      }

      await storageService.saveWorlds(worldsData);

      // Send completion with modelClass (not actual model name for privacy)
      const modelClass = getModelClass('fal-flux-2-turbo-edit');
      
      sendCompletion(operationId, {
        message: 'View created successfully',
        view: {
          id: viewNode.id,
          name: viewNode.name,
          type: viewNode.type,
          description: viewNode.description,
          operation: lookResponse.operation,
          target: lookResponse.target,
          primaryMedia: mediaEntry.id
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
