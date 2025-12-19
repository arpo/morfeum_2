/**
 * Create Node Handler
 * POST /api/mzoo/navigation/create-node
 * Create a new node via slash command (/new-host, /new-region, /new-location, /new-niche)
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import type { NodeType } from '../../../config/navigation';
import { findHostForRegion, addChildToWorldTree } from '../../../engine/navigation/navigationHelpers';
import { createNode } from '../../../engine/nodeCreation/core/createNode';
import { extractParentDNAContext } from '../../../engine/nodeCreation/core/dnaInheritance';
import { storageService } from '../../../services/storage/storageService';
import mediaService from '../../../services/media/mediaService';
import { sseService } from '../../../services/SSEService';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs } from '../navigation';

export async function createNodeHandler(req: Request, res: Response): Promise<void> {
  const { command, description, parentId, flags } = req.body as {
    command: string;
    description?: string;
    parentId?: string;
    flags: { createImage: boolean; backgroundTask: boolean };
  };

  // Validation
  if (!command) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: command'
    });
    return;
  }

  // Map command to node type
  const commandToNodeType: Record<string, NodeType> = {
    NEW_WORLD: 'host',
    NEW_REGION: 'region',
    NEW_LOCATION: 'location'
  };

  const nodeType = commandToNodeType[command];
  if (!nodeType) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Invalid command: ${command}. Valid commands: ${Object.keys(commandToNodeType).join(', ')}`
    });
    return;
  }

  // Validate parent requirement
  if (nodeType !== 'host' && !parentId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `${command} requires a parent node. Select a ${nodeType === 'region' ? 'host' : nodeType === 'location' ? 'region' : 'location'} first.`
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  // Generate unique operation ID
  const operationId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${operationId}`;

  console.log(`\n🚀 [CREATE-NODE] Starting ${command} pipeline...`);
  console.log(`[CREATE-NODE] Operation ID: ${operationId}`);
  console.log(`[CREATE-NODE] Description: ${description || '(auto-generated)'}`);
  console.log(`[CREATE-NODE] Parent ID: ${parentId || '(root)'}`);
  console.log(`[CREATE-NODE] Flags: createImage=${flags.createImage}, bgtask=${flags.backgroundTask}`);

  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline('navigation');
  pipelineConfigs.set(operationId, {
    pipelineType: 'navigation',
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
      command,
      nodeType
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // Send progress event
      sseService.sendEvent(operationId, 'progress', {
        stage: 'prompt_generation',
        message: `Creating ${nodeType}...`
      });

      // Load parent DNA context if parentId is provided
      // For pass-through regions, traverse up to find ancestor with DNA
      let parentContext;
      if (parentId) {
        const worldsData = await storageService.loadWorlds();
        const parentNode = worldsData?.nodes?.[parentId];
        if (parentNode) {
          // Check if parent is a pass-through region (empty DNA)
          const isPassThrough = parentNode.isPassThrough || 
            (parentNode.type === 'region' && (!parentNode.dna || Object.keys(parentNode.dna).length === 0));
          
          if (isPassThrough && worldsData?.worldTrees) {
            // Find the host (grandparent) by traversing worldTrees
            const hostNode = findHostForRegion(parentId, worldsData.worldTrees, worldsData.nodes);
            if (hostNode) {
              console.log(`[CREATE-NODE] Parent is pass-through region, using host DNA from ${hostNode.name}`);
              parentContext = extractParentDNAContext(hostNode.dna, {
                name: hostNode.name,
                description: hostNode.description,
                type: hostNode.type,
                dominantElements: hostNode.dominantElements || hostNode.structure?.dominantElements,
                uniqueIdentifiers: hostNode.uniqueIdentifiers || hostNode.structure?.uniqueIdentifiers,
                searchDesc: hostNode.searchDesc,
              });
            }
          } else {
            // Normal case: use parent's DNA directly
            parentContext = extractParentDNAContext(parentNode.dna, {
              name: parentNode.name,
              description: parentNode.description,
              type: parentNode.type,
              dominantElements: parentNode.dominantElements || parentNode.structure?.dominantElements,
              uniqueIdentifiers: parentNode.uniqueIdentifiers || parentNode.structure?.uniqueIdentifiers,
              searchDesc: parentNode.searchDesc,
            });
            console.log(`[CREATE-NODE] Loaded FULL parent context from ${parentNode.name} (${parentNode.type})`);
          }
        }
      }

      const result = await createNode(
        nodeType,
        description || `New ${nodeType}`,
        {
          apiKey,
          parentId,
          parentContext,
          createImage: flags.createImage
        }
      );

      console.log(`✅ [CREATE-NODE] Pipeline complete. Node: ${result.node?.name || 'unknown'}`);
      
      // If image was generated, create media entry and set primaryMedia
      if (result.imageUrl) {
        const mediaEntry = mediaService.createMedia({
          type: 'image',
          url: result.imageUrl,
          metadata: {
            prompt: result.imagePrompt || '',
            model: 'flux',
            width: 1920,
            height: 1080,
            aspectRatio: 'landscape_16_9'
          },
          entityRefs: [result.node.id]
        });
        
        result.node.primaryMedia = mediaEntry.id;
        console.log(`[CREATE-NODE] Created media entry: ${mediaEntry.id}`);
      }
      
      // Save node to storage and update worldTrees
      const updatedWorldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
      
      // Save node to nodes collection
      updatedWorldsData.nodes[result.node.id] = result.node;
      
      // Add to worldTrees based on node type
      if (nodeType === 'host') {
        // Host nodes go directly into worldTrees as root entries
        updatedWorldsData.worldTrees.push({
          id: result.node.id,
          type: 'host',
          children: []
        });
        console.log(`[CREATE-NODE] Added host to worldTrees: ${result.node.id}`);
      } else if (parentId) {
        // Child nodes (region, location, niche) need to be added to their parent's children array
        const childEntry = {
          id: result.node.id,
          type: nodeType,
          children: []
        };
        
        const added = addChildToWorldTree(updatedWorldsData.worldTrees, parentId, childEntry);
        if (added) {
          console.log(`[CREATE-NODE] Added ${nodeType} as child of ${parentId}`);
        } else {
          console.log(`[CREATE-NODE] Warning: Could not find parent ${parentId} in worldTrees`);
        }
      }
      
      // Save updated data
      await storageService.saveWorlds(updatedWorldsData);
      console.log(`[CREATE-NODE] Saved to storage`);
      
      // Send completion event
      sseService.sendEvent(operationId, 'completed', {
        message: 'Node created successfully',
        node: result.node,
        imageUrl: result.imageUrl
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
    } catch (error) {
      console.error(`\n❌ [CREATE-NODE ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create node'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}
