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
import { PipelineHelper } from '../../engine/pipelines/shared/pipelineHelpers';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { 
  generateImagePromptLayers,
  buildPromptFromLayers,
  ImagePromptLayers
} from './imagePromptGenerator';
import { getV2CameraConfig } from './cameraSettings';
import { cascadeDNA } from './promptBuilder';
import { applyMorfeumStyle } from '../../engine/generation/shared/applyMorfeumStyle';
import type { Host, Region, WorldNode, DNA } from '../types';

// Track pipeline configurations for SSE initialization
const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

// Export for use in routes.ts
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

  // Store pipeline configuration for SSE initialization BEFORE returning response
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
    const pipeline = new PipelineHelper(operationId, 'V2 DISPLAY', 'v2Display');
    pipeline.started('Loading node data...');
    
    try {
      // Step 1: Load node and generate prompt
      pipeline.startStage('prompt_generation', 'Creating image prompt...');

      const worldsData = await storageService.loadWorlds();
      if (!worldsData) {
        throw new Error('No worlds data found in storage');
      }

      const found = findNodeInTree(worldsData, nodeId);
      if (!found) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      const { node, nodeType, host, region } = found;
      
      // Cascade DNA from parent nodes
      const dnaChain: { host?: DNA; region?: DNA; location?: DNA } = {};
      if (host) dnaChain.host = host.dna;
      if (region) dnaChain.region = region.dna;
      if (nodeType === 'node') dnaChain.location = (node as WorldNode).dna;
      const cascadedDNA = cascadeDNA(dnaChain);
      
      // Get camera config for this node type
      const spaceType = (node as WorldNode).spaceType || 'exterior';
      const cameraConfig = getV2CameraConfig(
        nodeType === 'node' ? 'location' : nodeType,
        spaceType
      );
      
      // Generate image prompt layers via LLM
      const promptLayers = await generateImagePromptLayers(apiKey, {
        nodeType: nodeType === 'node' ? 'location' : nodeType,
        name: (node as any).name,
        description: (node as any).description || '',
        spaceType,
        dna: cascadedDNA,
        hostName: host?.name,
        regionName: region?.name,
        perspectiveGuidance: cameraConfig.perspectiveGuidance,
        weather: host?.weather,
        timeOfDay: host?.timeOfDay
      });
      
      // Build final prompt from layers (pass spaceType for locations, weather/time from host)
      const basePrompt = buildPromptFromLayers(
        promptLayers,
        cascadedDNA,
        cameraConfig,
        nodeType === 'node' ? spaceType : undefined,
        host?.weather,
        host?.timeOfDay
      );
      const imagePrompt = applyMorfeumStyle(basePrompt, {
        creatureMode: populate ? 'populate' : 'none'
      });

      pipeline.completeStage('prompt_generation', 'Image prompt created');

      // Step 2: Generate image
      pipeline.startStage('image_generation', 'Generating image...');

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

      pipeline.completeStage('image_generation', 'Image generated');

      // Create media entry with structured prompt data and layers
      // NOTE: Keep promptData minimal - avoid duplicating data from worlds.json
      // Node names, IDs, DNA etc. can be looked up via entityRefs
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imagePrompt,
          promptLayers,
          // Minimal promptData - only what's useful for debugging/auditing
          // All other info derivable via entityRefs + worlds.json
          promptData: {
            command: 'DISPLAY',
            populate: populate || false
          },
          model: 'flux',
          width: 1920,
          height: 1080,
          aspectRatio: 'landscape_16_9'
        },
        entityRefs: [nodeId]
      });

      // Update node with primaryMedia reference (imageUrl stored in media.json, not worlds.json)
      (node as any).primaryMedia = mediaEntry.id;

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);

      // Send completion with all timing info
      pipeline.completed('Image generated successfully', {
        node,
        nodeType,
        imageUrl,
        mediaId: mediaEntry.id,
        prompt: imagePrompt
      });
    } catch (error) {
      pipeline.error(error instanceof Error ? error : new Error(String(error)));
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}
