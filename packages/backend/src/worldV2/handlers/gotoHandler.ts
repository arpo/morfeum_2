/**
 * GOTO2 Route Handler
 * 
 * Handles the /GOTO2 command for creating sibling spaces within a container.
 * When user is on a space node, this finds the parent container and parent location,
 * then delegates to the same logic as GO_INSIDE2.
 * 
 * Flow:
 * 1. Validate current node is a space
 * 2. Find parent container and parent location
 * 3. Use parent location's image as source (not current space)
 * 4. Delegate to GO_INSIDE2 logic (which will find existing container)
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, editImage, hasMzooData } from '../../services/mzoo';
import { buildGoInsidePrompt, parseGoInsideResponse } from '../prompts/goInside';
import { buildEnterImageEditPrompt, buildEnterOutdoorEditPrompt, buildEnterSemiEnclosedEditPrompt } from '../prompts/imageEditPrompt';
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
 * Find node ancestry chain for context
 */
function findNodeAncestry(
  worldsData: any,
  nodeId: string
): {
  host?: Host;
  region?: any;
  locationChain: any[];
  currentNode: any;
  hostWeather?: string;
  hostTimeOfDay?: TimeOfDay;
} | null {
  const currentNode = worldsData.nodes[nodeId];
  if (!currentNode) return null;

  const locationChain: any[] = [];
  let host: Host | undefined;
  let region: any;

  for (const hostTree of worldsData.worldTrees) {
    const hostNode = worldsData.nodes[hostTree.id] as Host;
    if (!hostNode) continue;

    const path = findNodePath(hostTree, nodeId);
    if (path) {
      host = hostNode;
      
      let currentTree = hostTree;
      for (let i = 0; i < path.length; i++) {
        const childId = path[i];
        const childNode = worldsData.nodes[childId];
        
        if (childNode?.type === 'region') {
          region = childNode;
        } else if (childNode?.type === 'location' || childNode?.type === 'space' || childNode?.type === 'container') {
          locationChain.push(childNode);
        }
        
        currentTree = currentTree.children?.find((c: any) => c.id === childId);
        if (!currentTree) break;
      }

      return {
        host,
        region,
        locationChain,
        currentNode,
        hostWeather: hostNode.weather,
        hostTimeOfDay: hostNode.timeOfDay
      };
    }
  }

  return null;
}

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

function createFallbackPromptLayers(node: any): ImagePromptLayers {
  return {
    name: node.name || 'Unknown Location',
    description: node.description || 'A location in the world',
    background: 'Distant surroundings and sky',
    midground: 'Main architectural features and structures',
    foreground: 'Ground surface and immediate environment',
    lighting: 'Natural ambient lighting',
    atmosphere: 'Scene atmosphere with depth'
  };
}

export const gotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { nodeId, target } = req.body as { nodeId: string; target: string };

  // Validation
  if (!nodeId || !target || target.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: nodeId and target'
    });
    return;
  }

  const apiKey = (req as any).mzooApiKey;
  if (!apiKey) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Missing API key'
    });
    return;
  }

  // Load worlds data to validate node type
  const worldsData = await storageService.loadWorlds();
  if (!worldsData) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'No worlds data found'
    });
    return;
  }

  const currentNode = worldsData.nodes[nodeId];
  if (!currentNode) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Node ${nodeId} not found`
    });
    return;
  }

  // GOTO2 only works from space nodes
  if (currentNode.type !== 'space') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'GOTO2 can only be used from a space node. Use /GO_INSIDE2 from location nodes.'
    });
    return;
  }

  // Find parent container
  const container = worldsData.nodes[currentNode.parentId];
  if (!container || container.type !== 'container') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Current space is not inside a container'
    });
    return;
  }

  // Find parent location (container's parent)
  const parentLocationId = container.parentId;
  const parentLocation = worldsData.nodes[parentLocationId];
  if (!parentLocation) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Cannot find parent location for container'
    });
    return;
  }

  // Generate unique operation ID
  const operationId = generateOperationId('goto');
  const eventsUrl = setupPipeline(operationId, 'v2Goto');

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'GOTO2'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Get source image from parent location (NOT current space)
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'analyzing', 'Analyzing parent location...');

      const ancestry = findNodeAncestry(worldsData, parentLocationId);
      if (!ancestry) {
        throw new Error(`Parent location ${parentLocationId} not found in any world tree`);
      }

      // Get source image from parent location
      const { imageUrl: sourceImageUrl, promptLayers: sourcePromptLayers, mediaId: sourceMediaId } = getNodeMediaInfo(worldsData, parentLocationId);
      
      if (!sourceImageUrl) {
        throw new Error(`Parent location has no image. Generate an image for the location first using /DISPLAY`);
      }

      const effectiveSourcePromptLayers = sourcePromptLayers || createFallbackPromptLayers(parentLocation);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 2: Generate space node via LLM (container already exists)
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'structure', 'Creating new sibling space...');

      const goInsidePrompt = buildGoInsidePrompt(target, {
        name: parentLocation.name,
        description: parentLocation.description,
        sourcePromptLayers: effectiveSourcePromptLayers
      });

      const llmResult = await generateText(
        apiKey,
        [{ role: 'user', content: goInsidePrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(llmResult)) {
        throw new Error(llmResult.error || 'Failed to generate space structure');
      }

      // Parse response - we only need the space node (container already exists)
      const { space } = parseGoInsideResponse(llmResult.data.text, generateId);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Generate edited image for the new sibling space
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'image', 'Generating space view...');

      const promptContext = {
        sourcePromptLayers: effectiveSourcePromptLayers,
        targetPromptLayers: space.promptLayers,
        spaceType: space.spaceType,
        spaceName: space.name,
        parentName: parentLocation.name,
        weather: ancestry.hostWeather,
        timeOfDay: ancestry.hostTimeOfDay
      };
      
      let imageEditPrompt: string;
      switch (space.spaceType) {
        case 'outdoor':
          imageEditPrompt = buildEnterOutdoorEditPrompt(promptContext);
          break;
        case 'semi-enclosed':
          imageEditPrompt = buildEnterSemiEnclosedEditPrompt(promptContext);
          break;
        default:
          imageEditPrompt = buildEnterImageEditPrompt(promptContext);
      }

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
      // Stage 4: Save the new sibling space node
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'saving', 'Saving space...');

      // Save the new space node (container already exists)
      worldsData.nodes[space.id] = {
        ...space,
        parentId: container.id
      };

      // Create media entry
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imageEditPrompt,
          promptLayers: {
            name: space.name,
            description: space.description,
            ...space.promptLayers
          },
          promptData: {
            command: 'GOTO2'
          },
          model: 'fal-flux-2-turbo-edit',
          width: 1920,
          height: 1080,
          aspectRatio: 'landscape_16_9'
        },
        entityRefs: [space.id],
        parentMedia: sourceMediaId || undefined
      });

      // Update space node with primaryMedia reference
      (worldsData.nodes[space.id] as any).primaryMedia = mediaEntry.id;

      // Update world tree structure - add space as child of existing container
      for (const hostTree of worldsData.worldTrees) {
        const containerEntry = findTreeEntry(hostTree, container.id);
        if (containerEntry) {
          if (!containerEntry.children) {
            containerEntry.children = [];
          }
          containerEntry.children.push({
            id: space.id,
            type: 'space',
            children: []
          });
          break;
        }
      }

      await storageService.saveWorlds(worldsData);

      // Send completion
      sendCompletion(operationId, {
        message: 'Sibling space created successfully',
        container: {
          id: container.id,
          name: container.name,
          type: container.type,
          description: container.description
        },
        space: {
          id: space.id,
          name: space.name,
          type: space.type,
          spaceType: space.spaceType,
          description: space.description
        },
        imageUrl,
        mediaId: mediaEntry.id
      });

    } catch (error) {
      sendError(operationId, error);
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
