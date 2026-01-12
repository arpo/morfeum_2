/**
 * NEW_WORLD_LOCATION Route Handler
 * 
 * Creates a complete world hierarchy (Host + Region + Location) from a single concept,
 * then auto-runs display to generate an image for the location.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, generateImage, hasMzooData } from '../../services/mzoo';
import { buildHostDNAPrompt, parseHostResponse } from '../prompts/hostDNA';
import { buildRegionDNAPrompt, parseRegionResponse } from '../prompts/regionDNA';
import { buildLocationDNAPrompt, parseLocationResponse } from '../prompts/locationDNA';
import { 
  buildWorldLocationCategorizationPrompt, 
  parseWorldLocationCategorizationResponse 
} from '../prompts/worldLocationCategorization';
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
  sendError,
  cascadeRegionDNA
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
  console.log(`\n🚀 [V2-NEW-WORLD-LOCATION] Starting world creation...`);
  console.log(`[V2-NEW-WORLD-LOCATION] Operation ID: ${operationId}`);
  console.log(`[V2-NEW-WORLD-LOCATION] Concept: ${concept.substring(0, 100)}${concept.length > 100 ? '...' : ''}`);

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
      // Stage 1: Categorize concept into host/region/location
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'categorization', 'Analyzing concept...');

      const categorizationPrompt = buildWorldLocationCategorizationPrompt(concept);
      const categorizationResult = await generateText(
        apiKey,
        [{ role: 'user', content: categorizationPrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(categorizationResult)) {
        throw new Error(categorizationResult.error || 'Failed to categorize concept');
      }

      const categorization = parseWorldLocationCategorizationResponse(categorizationResult.data.text);
      console.log(`[V2-NEW-WORLD-LOCATION] Categorized:`, {
        host: categorization.host.name || categorization.host.concept.substring(0, 30),
        region: categorization.region ? (categorization.region.name || categorization.region.concept.substring(0, 30)) : 'PASS-THROUGH',
        location: categorization.location.concept.substring(0, 30)
      });

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 2: Create Host DNA (with visual constraints from categorization)
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'host_dna', 'Creating host...');

      const hostPrompt = buildHostDNAPrompt(categorization.host.concept, {
        visualConstraints: categorization.visualElements
      });
      const hostResult = await generateText(
        apiKey,
        [{ role: 'user', content: hostPrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(hostResult)) {
        throw new Error(hostResult.error || 'Failed to create host');
      }

      const host = parseHostResponse(hostResult.data.text, generateId);
      console.log(`✅ [V2-NEW-WORLD-LOCATION] Host created: ${host.name}`);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Create Region DNA (or pass-through)
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'region_dna', categorization.region ? 'Creating region...' : 'Creating pass-through region...');

      let region: Region;
      
      if (categorization.region) {
        // Real region - call LLM
        const regionPrompt = buildRegionDNAPrompt(categorization.region.concept, host);
        const regionResult = await generateText(
          apiKey,
          [{ role: 'user', content: regionPrompt }],
          AI_MODELS.SEED_GENERATION
        );

        if (!hasMzooData(regionResult)) {
          throw new Error(regionResult.error || 'Failed to create region');
        }

        region = parseRegionResponse(regionResult.data.text, generateId);
        console.log(`✅ [V2-NEW-WORLD-LOCATION] Region created: ${region.name}`);
      } else {
        // Pass-through region - no LLM call
        region = {
          id: generateId(),
          type: 'region',
          name: 'Region',
          slug: 'region',
          description: `Pass-through region in ${host.name}`,
          isPassThrough: true,
          dna: {
            essence: [],
            formsAndMaterials: [],
            colorAndLight: [],
            atmosphere: [],
            banned: []
          }
        } as Region;
        console.log(`✅ [V2-NEW-WORLD-LOCATION] Pass-through region created`);
      }

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 4: Create Location DNA
      // ═══════════════════════════════════════════════════════════════════════
      sendProgress(operationId, 'location_dna', 'Creating location...');

      const cascadedRegion = cascadeRegionDNA(region, host);
      const locationPrompt = buildLocationDNAPrompt(categorization.location.concept, cascadedRegion);
      const locationResult = await generateText(
        apiKey,
        [{ role: 'user', content: locationPrompt }],
        AI_MODELS.SEED_GENERATION
      );

      if (!hasMzooData(locationResult)) {
        throw new Error(locationResult.error || 'Failed to create location');
      }

      const location = parseLocationResponse(locationResult.data.text, generateId);
      console.log(`✅ [V2-NEW-WORLD-LOCATION] Location created: ${location.name}`);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 5: Save all nodes to storage
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
      console.log(`[V2-NEW-WORLD-LOCATION] Saved to storage`);

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 6: Generate image prompt
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
      // Stage 7: Generate image
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
      console.log(`✅ [V2-NEW-WORLD-LOCATION] Complete in ${totalElapsed}s`);

      sendCompletion(operationId, {
        message: 'World created successfully',
        host,
        region,
        location,
        imageUrl,
        mediaId: mediaEntry.id
      });
    } catch (error) {
      console.error(`\n❌ [V2-NEW-WORLD-LOCATION ERROR]`, error);
      sendError(operationId, error);
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
