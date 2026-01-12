/**
 * NEW_WORLD_LOCATION Route Handler
 * 
 * Creates a complete world hierarchy (Host + Region + Location) from a single concept
 * using a single LLM call, then auto-runs display to generate an image for the location.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, generateImage, hasMzooData } from '../../services/mzoo';
import { 
  buildWorldLocationFullPrompt, 
  parseWorldLocationFullResponse 
} from '../prompts/worldLocationFull';
import { storageService } from '../../services/storage/storageService';
import mediaService from '../../services/media/mediaService';
import { applyMorfeumStyle } from '../../engine/generation/shared/applyMorfeumStyle';
import {
  generateId,
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  sendProgress,
  sendCompletion,
  sendError
} from '../utils/routeUtils';
import { 
  generateImagePromptLayers,
  buildPromptFromLayers
} from '../display/imagePromptGenerator';
import { getV2CameraConfig } from '../display/cameraSettings';
import { cascadeDNA } from '../display/promptBuilder';
import type { Host, Region, WorldNode } from '../types';

export const newWorldLocationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { concept } = req.body as { concept: string };

  // Validation
  if (!concept || concept.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: concept'
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
  const operationId = generateOperationId('world-location');
  const eventsUrl = setupPipeline(operationId, 'v2CreateWorldLocation');

  const pipelineStartTime = Date.now();

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'NEW_WORLD_LOCATION'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Generate all nodes in single LLM call
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'world_creation', 'Creating world...');

      const fullPrompt = buildWorldLocationFullPrompt(concept);
      const fullResult = await generateText(
        apiKey,
        [{ role: 'user', content: fullPrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(fullResult)) {
        throw new Error(fullResult.error || 'Failed to create world');
      }

      const { host, region, location } = parseWorldLocationFullResponse(
        fullResult.data.text, 
        generateId
      );

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 2: Save all nodes to storage
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'saving', 'Saving world...');

      const worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };

      // Save nodes
      worldsData.nodes[host.id] = host;
      worldsData.nodes[region.id] = region;
      worldsData.nodes[location.id] = location;

      // Build world tree structure
      worldsData.worldTrees.push({
        id: host.id,
        type: 'host',
        children: [{
          id: region.id,
          type: 'region',
          children: [{
            id: location.id,
            type: 'location',
            children: []
          }]
        }]
      });

      // Auto-pin the new host
      if (!worldsData.pinnedIds.includes(host.id)) {
        worldsData.pinnedIds.push(host.id);
      }

      await storageService.saveWorlds(worldsData);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Generate image prompt
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'prompt_generation', 'Creating image prompt...');

      // Cascade DNA for image generation
      const dnaChain = {
        host: host.dna,
        region: region.dna,
        location: location.dna
      };
      const cascadedDNA = cascadeDNA(dnaChain);

      // Get camera config for location
      const cameraConfig = getV2CameraConfig('location', location.spaceType);

      // Generate image prompt layers via LLM
      const promptLayers = await generateImagePromptLayers(apiKey, {
        nodeType: 'location',
        name: location.name,
        description: location.description,
        spaceType: location.spaceType,
        dna: cascadedDNA,
        hostName: host.name,
        regionName: region.name,
        perspectiveGuidance: cameraConfig.perspectiveGuidance,
        weather: host.weather,
        timeOfDay: host.timeOfDay
      });

      // Build final prompt
      const basePrompt = buildPromptFromLayers(
        promptLayers,
        cascadedDNA,
        cameraConfig,
        location.spaceType,
        host.weather,
        host.timeOfDay
      );
      const imagePrompt = applyMorfeumStyle(basePrompt, { creatureMode: 'none' });

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 4: Generate image
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'image_generation', 'Generating image...');

      const imageResult = await generateImage(
        apiKey,
        imagePrompt,
        1,
        'landscape_16_9',
        'none'
      );

      if (imageResult.error || !imageResult.data?.images?.[0]?.url) {
        throw new Error(imageResult.error || 'Failed to generate image');
      }

      const imageUrl = imageResult.data.images[0].url;

      // Create media entry
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imagePrompt,
          promptLayers,
          promptData: {
            nodeType: 'location',
            nodeId: location.id,
            nodeName: location.name,
            hostId: host.id,
            hostName: host.name,
            regionId: region.id,
            regionName: region.name,
            populate: false,
            dna: location.dna
          },
          model: 'flux',
          width: 1920,
          height: 1080,
          aspectRatio: 'landscape_16_9'
        },
        entityRefs: [location.id]
      });

      // Update location with primaryMedia reference
      (worldsData.nodes[location.id] as any).primaryMedia = mediaEntry.id;
      await storageService.saveWorlds(worldsData);

      const totalElapsed = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);

      sendCompletion(operationId, {
        message: 'World created successfully',
        host,
        region,
        location,
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
