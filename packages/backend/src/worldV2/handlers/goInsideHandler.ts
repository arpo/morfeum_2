/**
 * GO_INSIDE2 Route Handler
 * 
 * Handles the /GO_INSIDE2 command for navigating into a new space.
 * Creates container + space nodes and generates an edited image.
 * 
 * Flow:
 * 1. Get current node and its source image + promptLayers
 * 2. Generate container + space nodes via LLM (with source promptLayers context)
 * 3. Build image edit prompt using promptLayers for visual preservation
 * 4. Call image edit API
 * 5. Save nodes, image, and new promptLayers (for future navigation)
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
 * Returns host, region info and current node details
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

  // Find the world tree containing this node
  for (const hostTree of worldsData.worldTrees) {
    const hostNode = worldsData.nodes[hostTree.id] as Host;
    if (!hostNode) continue;

    // Search for the node in this tree
    const path = findNodePath(hostTree, nodeId);
    if (path) {
      host = hostNode;
      
      // Traverse the path to build ancestry
      let currentTree = hostTree;
      for (let i = 0; i < path.length; i++) {
        const childId = path[i];
        const childNode = worldsData.nodes[childId];
        
        if (childNode?.type === 'region') {
          region = childNode;
        } else if (childNode?.type === 'location' || childNode?.type === 'space' || childNode?.type === 'container') {
          locationChain.push(childNode);
        }
        
        // Move to next level
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
 * Find existing container for a parent node
 * Returns the first container child of the parent node, or null if none exists
 */
function findExistingContainer(worldsData: any, parentNodeId: string): any | null {
  for (const nodeId in worldsData.nodes) {
    const node = worldsData.nodes[nodeId];
    if (node.type === 'container' && node.parentId === parentNodeId) {
      return node;
    }
  }
  return null;
}

/**
 * Create fallback promptLayers when source doesn't have them
 * Uses node name and description to create basic layers
 */
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

export const goInsideHandler = asyncHandler(async (req: Request, res: Response) => {
  const { nodeId, target } = req.body as { nodeId: string; target: string };

  // Validation
  if (!nodeId || !target || target.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: nodeId and target'
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
  const operationId = generateOperationId('go-inside');
  const eventsUrl = setupPipeline(operationId, 'v2GoInside');

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'GO_INSIDE2'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Analyze current location and get source image context
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'analyzing', 'Analyzing location...');

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

      // Check if container already exists for this parent node
      const existingContainer = findExistingContainer(worldsData, nodeId);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 2: Generate container + space nodes via LLM
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'structure', existingContainer ? 'Creating new space...' : 'Creating entrance structure...');

      // Pass source promptLayers to LLM so it can inherit visual style
      const goInsidePrompt = buildGoInsidePrompt(target, {
        name: ancestry.currentNode.name,
        description: ancestry.currentNode.description,
        sourcePromptLayers: effectiveSourcePromptLayers
      });

      const llmResult = await generateText(
        apiKey,
        [{ role: 'user', content: goInsidePrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(llmResult)) {
        throw new Error(llmResult.error || 'Failed to generate node structure');
      }

      const { container: newContainer, space } = parseGoInsideResponse(llmResult.data.text, generateId);
      
      // Use existing container if found, otherwise use newly generated one
      const container = existingContainer || newContainer;

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Generate edited image for the space
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'image', 'Generating space view...');

      // Build image edit prompt using promptLayers for visual preservation
      // Select prompt builder based on target space type:
      // - outdoor → use outdoor-optimized prompt (open sky, landscape visible)
      // - indoor/underground/etc → use enclosure-optimized prompt (solid ceiling, no exterior)
      const promptContext = {
        sourcePromptLayers: effectiveSourcePromptLayers, // What source image looks like
        targetPromptLayers: space.promptLayers,          // What target should look like
        spaceType: space.spaceType,
        spaceName: space.name,
        parentName: ancestry.currentNode.name,
        weather: ancestry.hostWeather,
        timeOfDay: ancestry.hostTimeOfDay
      };
      
      // Select prompt builder based on target space type
      let imageEditPrompt: string;
      switch (space.spaceType) {
        case 'outdoor':
          imageEditPrompt = buildEnterOutdoorEditPrompt(promptContext);
          break;
        case 'semi-enclosed':
          imageEditPrompt = buildEnterSemiEnclosedEditPrompt(promptContext);
          break;
        default:
          // indoor, underground, elevated all use the enclosed prompt
          imageEditPrompt = buildEnterImageEditPrompt(promptContext);
      }

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
      // Stage 4: Save nodes and image
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'saving', 'Saving space...');

      // Only save container if it's new (not existing)
      if (!existingContainer) {
        worldsData.nodes[container.id] = {
          ...container,
          parentId: nodeId
        };
      }

      // Always save the new space node
      worldsData.nodes[space.id] = {
        ...space,
        parentId: container.id
      };

      // Create media entry for space image with promptLayers for future navigation
      // NOTE: Keep promptData minimal - avoid duplicating data from worlds.json
      // Node names, IDs, DNA etc. can be looked up via entityRefs
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imageEditPrompt,
          // Store promptLayers for future navigation from this space
          promptLayers: {
            name: space.name,
            description: space.description,
            ...space.promptLayers
          },
          // Minimal promptData - only what's useful for debugging/auditing
          // All other info derivable via entityRefs + parentMedia + worlds.json
          promptData: {
            command: 'GO_INSIDE2'
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

      // Update world tree structure
      for (const hostTree of worldsData.worldTrees) {
        if (existingContainer) {
          // If container exists, find it in tree and add space as sibling
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
        } else {
          // If container is new, add container + space to parent node
          const parentEntry = findTreeEntry(hostTree, nodeId);
          if (parentEntry) {
            if (!parentEntry.children) {
              parentEntry.children = [];
            }
            parentEntry.children.push({
              id: container.id,
              type: 'container',
              children: [{
                id: space.id,
                type: 'space',
                children: []
              }]
            });
            break;
          }
        }
      }

      await storageService.saveWorlds(worldsData);

      // Send completion
      sendCompletion(operationId, {
        message: 'Space created successfully',
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
