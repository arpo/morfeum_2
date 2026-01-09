/**
 * World V2 Routes
 * 
 * Simplified world creation system with command chaining support.
 * TODO: Remove when V2 is stable and old system is removed
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../config';
import { sseService } from '../services/SSEService';
import { generateText, hasMzooData } from '../services/mzoo';
import { getStepsForPipeline } from '../engine/pipelines/shared/pipelineConfig';
import { buildHostDNAPrompt, parseHostResponse } from './prompts/hostDNA';
import { storageService } from '../services/storage/storageService';

const router = Router();

// Track pipeline configurations for SSE initialization
const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

/**
 * Generate a unique ID for nodes
 */
function generateId(): string {
  return `v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// SSE Events Endpoint
// ============================================

/**
 * GET /api/v2/events/:operationId
 * SSE endpoint for pipeline progress
 */
router.get('/events/:operationId', asyncHandler(async (req: Request, res: Response) => {
  const { operationId } = req.params;
  
  // Get stored pipeline config
  const config = pipelineConfigs.get(operationId);
  
  // Set up SSE connection
  sseService.addConnection(operationId, res, config);
}));

// ============================================
// NEW_HOST Command
// ============================================

/**
 * POST /api/v2/new-host
 * Create a new host node with DNA
 */
router.post('/new-host', asyncHandler(async (req: Request, res: Response) => {
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
  const operationId = `v2-host-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/v2/events/${operationId}`;
  
  const pipelineStartTime = Date.now();
  console.log(`\n🚀 [V2-NEW-HOST] Starting host creation...`);
  console.log(`[V2-NEW-HOST] Operation ID: ${operationId}`);
  console.log(`[V2-NEW-HOST] Concept: ${concept}`);
  
  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline('v2CreateHost');
  pipelineConfigs.set(operationId, {
    pipelineType: 'v2CreateHost',
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });
  
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
      // Send progress event
      sseService.sendEvent(operationId, 'progress', {
        stage: 'dna_generation',
        message: 'Creating Host DNA...'
      });
      
      // Build prompt and call LLM
      const prompt = buildHostDNAPrompt(concept);
      
      console.log(`[V2-NEW-HOST] Calling LLM for DNA generation...`);
      const startTime = Date.now();
      
      // generateText expects messages array format
      const messages = [{ role: 'user', content: prompt }];
      const llmResponse = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
      
      const duration = Date.now() - startTime;
      console.log(`[V2-NEW-HOST] LLM response received in ${duration}ms`);
      
      // Check for errors
      if (!hasMzooData(llmResponse)) {
        throw new Error(llmResponse.error || 'Failed to generate text');
      }
      
      // Parse and validate response
      const host = parseHostResponse(llmResponse.data.text, generateId);
      
      console.log(`✅ [V2-NEW-HOST] Host created: ${host.name}`);
      console.log(`[V2-NEW-HOST] DNA essence: ${host.dna.essence.join(', ')}`);
      
      // Save host to storage
      const worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
      
      // Add node to nodes collection
      worldsData.nodes[host.id] = host;
      
      // Add to worldTrees as a root entry
      worldsData.worldTrees.push({
        id: host.id,
        type: 'host',
        children: []
      });
      
      // Auto-pin the new host so it appears in tree view
      if (!worldsData.pinnedIds.includes(host.id)) {
        worldsData.pinnedIds.push(host.id);
      }
      
      await storageService.saveWorlds(worldsData);
      console.log(`[V2-NEW-HOST] Saved to storage`);
      
      const totalElapsed = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);
      console.log(`✅ [V2-NEW-HOST] Complete in ${totalElapsed}s`);
      
      // Send completion event with host data
      sseService.sendEvent(operationId, 'completed', {
        message: 'Host created successfully',
        host
      });
      
      // Close connection after a short delay
      setTimeout(() => sseService.closeConnection(operationId), 1000);
      
    } catch (error) {
      console.error(`\n❌ [V2-NEW-HOST ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create host'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}));

export { router as worldV2Router };
