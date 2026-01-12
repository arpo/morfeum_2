/**
 * NEW_LOCATION2 Route Handler
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, hasMzooData } from '../../services/mzoo';
import { buildLocationDNAPrompt, parseLocationResponse } from '../prompts/locationDNA';
import { storageService } from '../../services/storage/storageService';
import {
  generateId,
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  sendProgress,
  sendCompletion,
  sendError,
  findRegionWithHost,
  cascadeRegionDNA
} from '../utils/routeUtils';

export const newLocationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { concept, regionId } = req.body as { concept: string; regionId: string };

  // Validation
  if (!concept || concept.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: concept'
    });
    return;
  }

  if (!regionId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: regionId'
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

  // Load region and host from storage
  const worldsData = await storageService.loadWorlds();
  if (!worldsData) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      error: 'No worlds data found'
    });
    return;
  }

  const result = findRegionWithHost(worldsData, regionId);
  if (!result) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      error: `Region not found: ${regionId}`
    });
    return;
  }

  const { region, host } = result;

  // Create cascaded region with host DNA merged
  const cascadedRegion = cascadeRegionDNA(region, host);

  // Generate unique operation ID
  const operationId = generateOperationId('location');
  const eventsUrl = setupPipeline(operationId, 'v2CreateNode');

  const pipelineStartTime = Date.now();
  console.log(`\n🚀 [V2-NEW-LOCATION] Starting location creation...`);
  console.log(`[V2-NEW-LOCATION] Operation ID: ${operationId}`);
  console.log(`[V2-NEW-LOCATION] Concept: ${concept}`);
  console.log(`[V2-NEW-LOCATION] Parent Region: ${region.name} (${regionId})`);
  console.log(`[V2-NEW-LOCATION] Host: ${host.name}`);

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'NEW_LOCATION2'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      sendProgress(operationId, 'dna_generation', 'Creating Location DNA...');

      // Build prompt and call LLM
      const prompt = buildLocationDNAPrompt(concept, cascadedRegion);

      console.log(`[V2-NEW-LOCATION] Calling LLM for DNA generation...`);
      const startTime = Date.now();

      const messages = [{ role: 'user', content: prompt }];
      const llmResponse = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);

      const duration = Date.now() - startTime;
      console.log(`[V2-NEW-LOCATION] LLM response received in ${duration}ms`);

      if (!hasMzooData(llmResponse)) {
        throw new Error(llmResponse.error || 'Failed to generate text');
      }

      // Parse and validate response
      const location = parseLocationResponse(llmResponse.data.text, generateId);

      console.log(`✅ [V2-NEW-LOCATION] Location created: ${location.name}`);
      console.log(`[V2-NEW-LOCATION] Space type: ${location.spaceType}`);

      // Save location to storage
      const currentData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };

      currentData.nodes[location.id] = location;

      // Find region in worldTrees and add location as child
      for (const hostTree of currentData.worldTrees) {
        const regionEntry = hostTree.children?.find((child: any) => child.id === regionId);
        if (regionEntry) {
          if (!regionEntry.children) {
            regionEntry.children = [];
          }
          regionEntry.children.push({
            id: location.id,
            type: 'location',
            children: []
          });
          break;
        }
      }

      await storageService.saveWorlds(currentData);
      console.log(`[V2-NEW-LOCATION] Saved to storage`);

      const totalElapsed = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);
      console.log(`✅ [V2-NEW-LOCATION] Complete in ${totalElapsed}s`);

      sendCompletion(operationId, {
        message: 'Location created successfully',
        location,
        regionId
      });
    } catch (error) {
      console.error(`\n❌ [V2-NEW-LOCATION ERROR]`, error);
      sendError(operationId, error);
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
