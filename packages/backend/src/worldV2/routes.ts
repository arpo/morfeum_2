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
import { buildRegionDNAPrompt, parseRegionResponse } from './prompts/regionDNA';
import { buildLocationDNAPrompt, parseLocationResponse } from './prompts/locationDNA';
import { storageService } from '../services/storage/storageService';
import { Host, Region } from './types';
import { displayHandler, displayPipelineConfigs } from './display';

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
  
  // Get stored pipeline config - check both local and display configs
  const config = pipelineConfigs.get(operationId) || displayPipelineConfigs.get(operationId);
  
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

// ============================================
// NEW_REGION2 Command
// ============================================

/**
 * POST /api/v2/new-region
 * Create a new region node under a host (V2 system)
 */
router.post('/new-region', asyncHandler(async (req: Request, res: Response) => {
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
  const operationId = `v2-region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/v2/events/${operationId}`;
  
  const pipelineStartTime = Date.now();
  console.log(`\n🚀 [V2-NEW-REGION] Starting region creation...`);
  console.log(`[V2-NEW-REGION] Operation ID: ${operationId}`);
  console.log(`[V2-NEW-REGION] Concept: ${concept}`);
  console.log(`[V2-NEW-REGION] Parent Host: ${host.name} (${hostId})`);
  
  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline('v2CreateRegion');
  pipelineConfigs.set(operationId, {
    pipelineType: 'v2CreateRegion',
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
      command: 'NEW_REGION2'
    }
  });
  
  // Run pipeline asynchronously
  (async () => {
    try {
      // Send progress event
      sseService.sendEvent(operationId, 'progress', {
        stage: 'dna_generation',
        message: 'Creating Region DNA...'
      });
      
      // Build prompt and call LLM
      const prompt = buildRegionDNAPrompt(concept, host);
      
      console.log(`[V2-NEW-REGION] Calling LLM for DNA generation...`);
      const startTime = Date.now();
      
      // generateText expects messages array format
      const messages = [{ role: 'user', content: prompt }];
      const llmResponse = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
      
      const duration = Date.now() - startTime;
      console.log(`[V2-NEW-REGION] LLM response received in ${duration}ms`);
      
      // Check for errors
      if (!hasMzooData(llmResponse)) {
        throw new Error(llmResponse.error || 'Failed to generate text');
      }
      
      // Parse and validate response
      const region = parseRegionResponse(llmResponse.data.text, generateId);
      
      console.log(`✅ [V2-NEW-REGION] Region created: ${region.name}`);
      
      // Save region to storage
      const currentData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
      
      // Add node to nodes collection
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
      
      // Send completion event with region data
      sseService.sendEvent(operationId, 'completed', {
        message: 'Region created successfully',
        region,
        hostId
      });
      
      // Close connection after a short delay
      setTimeout(() => sseService.closeConnection(operationId), 1000);
      
    } catch (error) {
      console.error(`\n❌ [V2-NEW-REGION ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create region'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}));

// ============================================
// NEW_LOCATION2 Command
// ============================================

/**
 * Helper to find a region and its parent host in the tree
 */
function findRegionWithHost(worldsData: any, regionId: string): { region: Region; host: Host; hostTreeEntry: any; regionTreeEntry: any } | null {
  const region = worldsData.nodes[regionId];
  if (!region || region.type !== 'region') {
    return null;
  }
  
  // Find the host that contains this region
  for (const hostTree of worldsData.worldTrees) {
    const host = worldsData.nodes[hostTree.id];
    if (!host || host.type !== 'host') continue;
    
    const regionTreeEntry = hostTree.children?.find((child: any) => child.id === regionId);
    if (regionTreeEntry) {
      return { 
        region: region as Region, 
        host: host as Host,
        hostTreeEntry: hostTree,
        regionTreeEntry
      };
    }
  }
  
  return null;
}

/**
 * Merge host DNA into region for cascaded context
 */
function cascadeRegionDNA(region: Region, host: Host): Region & { hostDna: Host['dna'] } {
  return {
    ...region,
    hostDna: host.dna,
    dna: {
      // For each DNA field, use region's if non-empty, else inherit from host
      essence: region.dna.essence.length > 0 ? region.dna.essence : host.dna.essence,
      formsAndMaterials: region.dna.formsAndMaterials.length > 0 ? region.dna.formsAndMaterials : host.dna.formsAndMaterials,
      colorAndLight: region.dna.colorAndLight.length > 0 ? region.dna.colorAndLight : host.dna.colorAndLight,
      atmosphere: region.dna.atmosphere.length > 0 ? region.dna.atmosphere : host.dna.atmosphere,
      banned: [...host.dna.banned, ...region.dna.banned] // Merge banned lists
    }
  };
}

/**
 * POST /api/v2/new-location
 * Create a new location node under a region (V2 system)
 */
router.post('/new-location', asyncHandler(async (req: Request, res: Response) => {
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
  
  const { region, host, regionTreeEntry } = result;
  
  // Create cascaded region with host DNA merged
  const cascadedRegion = cascadeRegionDNA(region, host);
  
  // Generate unique operation ID
  const operationId = `v2-location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/v2/events/${operationId}`;
  
  const pipelineStartTime = Date.now();
  console.log(`\n🚀 [V2-NEW-LOCATION] Starting location creation...`);
  console.log(`[V2-NEW-LOCATION] Operation ID: ${operationId}`);
  console.log(`[V2-NEW-LOCATION] Concept: ${concept}`);
  console.log(`[V2-NEW-LOCATION] Parent Region: ${region.name} (${regionId})`);
  console.log(`[V2-NEW-LOCATION] Host: ${host.name}`);
  
  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline('v2CreateNode');
  pipelineConfigs.set(operationId, {
    pipelineType: 'v2CreateNode',
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
      command: 'NEW_LOCATION2'
    }
  });
  
  // Run pipeline asynchronously
  (async () => {
    try {
      // Send progress event
      sseService.sendEvent(operationId, 'progress', {
        stage: 'dna_generation',
        message: 'Creating Location DNA...'
      });
      
      // Build prompt and call LLM
      const prompt = buildLocationDNAPrompt(concept, cascadedRegion);
      
      console.log(`[V2-NEW-LOCATION] Calling LLM for DNA generation...`);
      const startTime = Date.now();
      
      // generateText expects messages array format
      const messages = [{ role: 'user', content: prompt }];
      const llmResponse = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
      
      const duration = Date.now() - startTime;
      console.log(`[V2-NEW-LOCATION] LLM response received in ${duration}ms`);
      
      // Check for errors
      if (!hasMzooData(llmResponse)) {
        throw new Error(llmResponse.error || 'Failed to generate text');
      }
      
      // Parse and validate response
      const location = parseLocationResponse(llmResponse.data.text, generateId);
      
      console.log(`✅ [V2-NEW-LOCATION] Location created: ${location.name}`);
      console.log(`[V2-NEW-LOCATION] Space type: ${location.spaceType}`);
      
      // Save location to storage
      const currentData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
      
      // Add node to nodes collection
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
      
      // Send completion event with location data
      sseService.sendEvent(operationId, 'completed', {
        message: 'Location created successfully',
        location,
        regionId
      });
      
      // Close connection after a short delay
      setTimeout(() => sseService.closeConnection(operationId), 1000);
      
    } catch (error) {
      console.error(`\n❌ [V2-NEW-LOCATION ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create location'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}));

// ============================================
// DISPLAY Command
// ============================================

/**
 * POST /api/v2/display
 * Generate image for a V2 node using cascaded DNA
 */
router.post('/display', displayHandler);

export { router as worldV2Router };
