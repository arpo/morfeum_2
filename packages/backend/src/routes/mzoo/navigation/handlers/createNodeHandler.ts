/**
 * Create Node Handler
 * Handles /new-host, /new-region, /new-location, /new-niche commands
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../../config';
import type { NodeType } from '../../../../config/navigation';
import { sseService } from '../../../../services/SSEService';
import { getStepsForPipeline } from '../../../../engine/pipelines/shared/pipelineConfig';
import { createNode } from '../../../../engine/nodeCreation/core/createNode';
import { extractParentDNAContext } from '../../../../engine/nodeCreation/core/dnaInheritance';
import { getResolvedNodeDNA } from '../../../../engine/hierarchyAnalysis/dnaMerge';
import { storageService } from '../../../../services/storage/storageService';
import { pipelineConfigs, generateOperationId } from '../shared';

// Map command to node type
const commandToNodeType: Record<string, NodeType> = {
  NEW_HOST: 'host',
  NEW_REGION: 'region',
  NEW_LOCATION: 'location',
  NEW_NICHE: 'niche'
};

/**
 * POST /api/mzoo/navigation/create-node
 * Create a new node via slash command
 */
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
  const operationId = generateOperationId('node');
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
      // Uses getResolvedNodeDNA to walk up the entire ancestry chain (host → region → location)
      // This ensures null values in parent DNA are filled from grandparents
      let parentContext;
      if (parentId) {
        const worldsData = await storageService.loadWorlds();
        const parentNode = worldsData?.nodes?.[parentId];
        
        if (parentNode) {
          // Get fully-resolved parent DNA (parent's DNA + nulls filled from grandparents)
          const resolvedParentDNA = getResolvedNodeDNA(
            parentId,
            worldsData?.nodes || {},
            worldsData?.worldTrees || []
          );
          
          if (resolvedParentDNA) {
            // Extract parent context from the fully-resolved parent DNA
            parentContext = extractParentDNAContext(resolvedParentDNA);
            console.log(`[CREATE-NODE] Loaded RESOLVED DNA for ${parentNode.name} (${parentNode.type})`);
          } else if (parentNode.dna) {
            // Fallback to immediate parent DNA if ancestry resolution fails
            parentContext = extractParentDNAContext(parentNode.dna);
            console.log(`[CREATE-NODE] Loaded parent DNA from ${parentNode.name} (${parentNode.type})`);
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
