/**
 * NEW_WORLD_LOCATION_INTERIOR Route Handler
 * 
 * Creates a complete world hierarchy (Host + Region + Exterior Location + Interior Location)
 * from a single concept using a single LLM call, then auto-runs display to generate
 * an image for the interior location.
 * 
 * Similar to newWorldLocationHandler.ts but creates 4 nodes instead of 3.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, generateImage, hasMzooData } from '../../services/mzoo';
import { 
  buildWorldLocationInteriorPrompt, 
  parseWorldLocationInteriorResponse 
} from '../prompts/worldLocationInterior';
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
import type { Host, Region } from '../types';

export const newWorldLocationInteriorHandler = asyncHandler(async (req: Request, res: Response) => {
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
  const operationId = generateOperationId('world-location-interior');
  const eventsUrl = setupPipeline(operationId, 'v2CreateWorldLocationInterior');

  const pipelineStartTime = Date.now();

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'NEW_WORLD_LOCATION_INTERIOR'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Generate all 4 nodes in single LLM call
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'interior_creation', 'Creating world with interior...');

      const fullPrompt = buildWorldLocationInteriorPrompt(concept);
      const fullResult = await generateText(
        apiKey,
        [{ role: 'user', content: fullPrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(fullResult)) {
        throw new Error(fullResult.error || 'Failed to create world');
      }

      const { host, region, exteriorLocation, interiorLocation } = parseWorldLocationInteriorResponse(
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
      worldsData.nodes[exteriorLocation.id] = exteriorLocation;
      worldsData.nodes[interiorLocation.id] = interiorLocation;

      // Build world tree structure with 4 levels
      worldsData.worldTrees.push({
        id: host.id,
        type: 'host',
        children: [{
          id: region.id,
          type: 'region',
          children: [{
            id: exteriorLocation.id,
            type: 'location',
            children: [{
              id: interiorLocation.id,
              type: 'location',
              children: []
            }]
          }]
        }]
      });

      // Auto-pin the new host
      if (!worldsData.pinnedIds.includes(host.id)) {
        worldsData.pinnedIds.push(host.id);
      }

      await storageService.saveWorlds(worldsData);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Generate image prompt for INTERIOR
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'prompt_generation', 'Creating image prompt...');

      // Cascade DNA for image generation (full chain including interior)
      const dnaChain = {
        host: host.dna,
        region: region.dna,
        location: exteriorLocation.dna,
        interior: interiorLocation.dna
      };
      const cascadedDNA = cascadeDNA(dnaChain);

      // Get camera config for interior location
      const cameraConfig = getV2CameraConfig('location', 'interior');

      // Generate image prompt layers via LLM
      const promptLayers = await generateImagePromptLayers(apiKey, {
        nodeType: 'location',
        name: interiorLocation.name,
        description: interiorLocation.description,
        spaceType: 'interior',
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
        'interior',
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

      // Create media entry with minimal promptData
      // All node data (name, type, DNA, hierarchy) is available via entityRefs + worlds.json
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imagePrompt,
          promptLayers,
          promptData: {
            command: 'NEW_WORLD_LOCATION_INTERIOR'
          },
          model: 'flux',
          width: 1920,
          height: 1080,
          aspectRatio: 'landscape_16_9'
        },
        entityRefs: [interiorLocation.id]
      });

      // Update interior location with primaryMedia reference
      (worldsData.nodes[interiorLocation.id] as any).primaryMedia = mediaEntry.id;
      await storageService.saveWorlds(worldsData);

      const totalElapsed = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);

      sendCompletion(operationId, {
        message: 'World with interior created successfully',
        host,
        region,
        exteriorLocation,
        interiorLocation,
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
