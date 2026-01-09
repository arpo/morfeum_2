/**
 * V2 Display Handler
 * 
 * POST /api/v2/display
 * Generate image for a V2 node using cascaded DNA.
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { storageService } from '../../services/storage/storageService';
import { generateImage } from '../../services/mzoo';
import mediaService from '../../services/media/mediaService';
import { sseService } from '../../services/SSEService';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { 
  buildHostImagePrompt, 
  buildRegionImagePrompt, 
  buildLocationImagePrompt,
  BuildPromptOptions
} from './promptBuilder';
import type { Host, Region, WorldNode } from '../types';
import type { CreatureMode } from '../../engine/generation/shared/imagePromptTypes';

// Track pipeline configurations for SSE initialization (same pattern as routes.ts)
const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

// Export for use in routes.ts if needed
export { pipelineConfigs as displayPipelineConfigs };

interface DisplayRequest {
  nodeId: string;
  populate?: boolean; // --populate flag
}

/**
 * Find a node and its parent chain in the world tree structure
 * V2 nodes are stored in worldsData.nodes with tree structure in worldsData.worldTrees
 */
function findNodeInTree(
  worldsData: any,
  nodeId: string
): { 
  node: Host | Region | WorldNode; 
  nodeType: 'host' | 'region' | 'node';
  host?: Host;
  region?: Region;
} | null {
  // First, check if the node exists in the nodes collection
  const node = worldsData.nodes?.[nodeId];
  if (!node) {
    return null;
  }
  
  const nodeType = node.type as 'host' | 'region' | 'location' | 'node';
  
  // If it's a host, we're done
  if (nodeType === 'host') {
    return { node: node as Host, nodeType: 'host', host: node as Host };
  }
  
  // For region or location, we need to find the parent chain via worldTrees
  for (const hostTree of worldsData.worldTrees || []) {
    const host = worldsData.nodes?.[hostTree.id] as Host;
    if (!host) continue;
    
    // Check if this is the region we're looking for
    if (nodeType === 'region') {
      const regionEntry = hostTree.children?.find((child: any) => child.id === nodeId);
      if (regionEntry) {
        return { node: node as Region, nodeType: 'region', host, region: node as Region };
      }
    }
    
    // Check for location within regions
    if (nodeType === 'location' || nodeType === 'node') {
      for (const regionEntry of hostTree.children || []) {
        const region = worldsData.nodes?.[regionEntry.id] as Region;
        if (!region) continue;
        
        const locationEntry = regionEntry.children?.find((child: any) => child.id === nodeId);
        if (locationEntry) {
          return { node: node as WorldNode, nodeType: 'node', host, region };
        }
      }
    }
  }
  
  // Node exists but not in tree (orphan) - return what we have
  if (nodeType === 'region') {
    return { node: node as Region, nodeType: 'region' };
  }
  if (nodeType === 'location' || nodeType === 'node') {
    return { node: node as WorldNode, nodeType: 'node' };
  }
  
  return null;
}

export async function displayHandler(req: Request, res: Response): Promise<void> {
  const { nodeId, populate } = req.body as DisplayRequest;

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
  const operationId = `v2-display-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/v2/events/${operationId}`;

  // Use pipeline config
  const steps = getStepsForPipeline('v2Display');
  pipelineConfigs.set(operationId, {
    pipelineType: 'v2Display',
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
    
    try {
      // Step 1: Load node and build prompt
      sseService.sendEvent(operationId, 'progress', {
        stage: 'prompt_generation',
        message: 'Building image prompt...'
      });

      const worldsData = await storageService.loadWorlds();
      if (!worldsData) {
        throw new Error('No worlds data found in storage');
      }

      const found = findNodeInTree(worldsData, nodeId);
      if (!found) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      const { node, nodeType, host, region } = found;
      
      // Build prompt options
      const promptOptions: BuildPromptOptions = {
        creatureMode: populate ? 'populate' : 'none'
      };

      // Build prompt based on node type
      let imagePrompt: string;
      
      switch (nodeType) {
        case 'host':
          imagePrompt = buildHostImagePrompt(node as Host, promptOptions);
          break;
        case 'region':
          if (!host) throw new Error('Host not found for region');
          imagePrompt = buildRegionImagePrompt(host, node as Region, promptOptions);
          break;
        case 'node':
          if (!host || !region) throw new Error('Host/Region not found for node');
          imagePrompt = buildLocationImagePrompt(host, region, node as WorldNode, promptOptions);
          break;
        default:
          throw new Error(`Unknown node type: ${nodeType}`);
      }

      // Step 2: Generate image
      sseService.sendEvent(operationId, 'progress', {
        stage: 'image_generation',
        message: 'Generating image...'
      });

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

      // Update node with image URL
      (node as any).imageUrl = imageUrl;
      (node as any).primaryMedia = mediaEntry.id;

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);
      
      const totalTime = Date.now() - startTime;

      // Send completion event
      sseService.sendEvent(operationId, 'completed', {
        message: 'Image generated successfully',
        node,
        nodeType,
        imageUrl,
        mediaId: mediaEntry.id,
        prompt: imagePrompt,
        timings: {
          total: totalTime
        }
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
    } catch (error) {
      console.error(`[V2 DISPLAY ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to generate image'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}
