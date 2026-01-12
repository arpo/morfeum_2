/**
 * NEW_REGION2 Route Handler
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, hasMzooData } from '../../services/mzoo';
import { buildRegionDNAPrompt, parseRegionResponse } from '../prompts/regionDNA';
import { storageService } from '../../services/storage/storageService';
import type { Host } from '../types';
import {
  generateId,
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  sendProgress,
  sendCompletion,
  sendError
} from '../utils/routeUtils';

export const newRegionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { concept, hostId } = req.body as { concept: string; hostId: string };

  // Validation
  if (!concept || concept.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: concept'
    });
    return;
  }

  if (!hostId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: hostId'
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

  // Load host from storage
  const worldsData = await storageService.loadWorlds();
  if (!worldsData || !worldsData.nodes[hostId]) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      error: `Host not found: ${hostId}`
    });
    return;
  }

  const host = worldsData.nodes[hostId] as Host;
  if (host.type !== 'host') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Node ${hostId} is not a host (type: ${host.type})`
    });
    return;
  }

  // Generate unique operation ID
  const operationId = generateOperationId('region');
  const eventsUrl = setupPipeline(operationId, 'v2CreateRegion');

  const pipelineStartTime = Date.now();
  console.log(`\n🚀 [V2-NEW-REGION] Starting region creation...`);
  console.log(`[V2-NEW-REGION] Operation ID: ${operationId}`);
  console.log(`[V2-NEW-REGION] Concept: ${concept}`);
  console.log(`[V2-NEW-REGION] Parent Host: ${host.name} (${hostId})`);

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'NEW_REGION2'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      sendProgress(operationId, 'dna_generation', 'Creating Region DNA...');

      // Build prompt and call LLM
      const prompt = buildRegionDNAPrompt(concept, host);

      console.log(`[V2-NEW-REGION] Calling LLM for DNA generation...`);
      const startTime = Date.now();

      const messages = [{ role: 'user', content: prompt }];
      const llmResponse = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);

      const duration = Date.now() - startTime;
      console.log(`[V2-NEW-REGION] LLM response received in ${duration}ms`);

      if (!hasMzooData(llmResponse)) {
        throw new Error(llmResponse.error || 'Failed to generate text');
      }

      // Parse and validate response
      const region = parseRegionResponse(llmResponse.data.text, generateId);

      console.log(`✅ [V2-NEW-REGION] Region created: ${region.name}`);

      // Save region to storage
      const currentData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };

      currentData.nodes[region.id] = region;

      // Find host in worldTrees and add region as child
      const hostTree = currentData.worldTrees.find(tree => tree.id === hostId);
      if (hostTree) {
        if (!hostTree.children) {
          hostTree.children = [];
        }
        hostTree.children.push({
          id: region.id,
          type: 'region',
          children: []
        });
      }

      await storageService.saveWorlds(currentData);
      console.log(`[V2-NEW-REGION] Saved to storage`);

      const totalElapsed = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);
      console.log(`✅ [V2-NEW-REGION] Complete in ${totalElapsed}s`);

      sendCompletion(operationId, {
        message: 'Region created successfully',
        region,
        hostId
      });
    } catch (error) {
      console.error(`\n❌ [V2-NEW-REGION ERROR]`, error);
      sendError(operationId, error);
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
