/**
 * NEW_HOST Route Handler
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, hasMzooData } from '../../services/mzoo';
import { buildHostDNAPrompt, parseHostResponse } from '../prompts/hostDNA';
import { storageService } from '../../services/storage/storageService';
import {
  generateId,
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  sendProgress,
  sendCompletion,
  sendError
} from '../utils/routeUtils';

export const newHostHandler = asyncHandler(async (req: Request, res: Response) => {
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
  const operationId = generateOperationId('host');
  const eventsUrl = setupPipeline(operationId, 'v2CreateHost');

  const pipelineStartTime = Date.now();
  console.log(`\n🚀 [V2-NEW-HOST] Starting host creation...`);
  console.log(`[V2-NEW-HOST] Operation ID: ${operationId}`);
  console.log(`[V2-NEW-HOST] Concept: ${concept}`);

  // Return response immediately with eventsUrl
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'NEW_HOST'
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      sendProgress(operationId, 'dna_generation', 'Creating Host DNA...');

      // Build prompt and call LLM
      const prompt = buildHostDNAPrompt(concept);

      console.log(`[V2-NEW-HOST] Calling LLM for DNA generation...`);
      const startTime = Date.now();

      const messages = [{ role: 'user', content: prompt }];
      const llmResponse = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);

      const duration = Date.now() - startTime;
      console.log(`[V2-NEW-HOST] LLM response received in ${duration}ms`);

      if (!hasMzooData(llmResponse)) {
        throw new Error(llmResponse.error || 'Failed to generate text');
      }

      // Parse and validate response
      const host = parseHostResponse(llmResponse.data.text, generateId);

      console.log(`✅ [V2-NEW-HOST] Host created: ${host.name}`);
      console.log(`[V2-NEW-HOST] DNA essence: ${host.dna.essence.join(', ')}`);

      // Save host to storage
      const worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };

      worldsData.nodes[host.id] = host;

      worldsData.worldTrees.push({
        id: host.id,
        type: 'host',
        children: []
      });

      // Auto-pin the new host
      if (!worldsData.pinnedIds.includes(host.id)) {
        worldsData.pinnedIds.push(host.id);
      }

      await storageService.saveWorlds(worldsData);
      console.log(`[V2-NEW-HOST] Saved to storage`);

      const totalElapsed = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);
      console.log(`✅ [V2-NEW-HOST] Complete in ${totalElapsed}s`);

      sendCompletion(operationId, {
        message: 'Host created successfully',
        host
      });
    } catch (error) {
      console.error(`\n❌ [V2-NEW-HOST ERROR]`, error);
      sendError(operationId, error);
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
