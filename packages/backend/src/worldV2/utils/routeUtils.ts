/**
 * V2 Route Utilities
 */

import { sseService } from '../../services/SSEService';
import { getStepsForPipeline, type PipelineType } from '../../engine/pipelines/shared/pipelineConfig';
import type { Host, Region, TimeOfDay } from '../types';

// Track pipeline configurations for SSE initialization
export const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

/**
 * Generate a unique ID for nodes
 */
export function generateId(): string {
  return `v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate operation ID for a specific command type
 */
export function generateOperationId(prefix: string): string {
  return `v2-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store pipeline configuration and return eventsUrl
 */
export function setupPipeline(operationId: string, pipelineType: PipelineType): string {
  const steps = getStepsForPipeline(pipelineType);
  pipelineConfigs.set(operationId, {
    pipelineType,
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });
  return `/api/v2/events/${operationId}`;
}

/**
 * Clean up pipeline config after completion
 */
export function cleanupPipeline(operationId: string): void {
  pipelineConfigs.delete(operationId);
}

/**
 * Send SSE progress event
 */
export function sendProgress(operationId: string, stage: string, message: string): void {
  sseService.sendEvent(operationId, 'progress', { stage, message });
}

/**
 * Send SSE completion event
 */
export function sendCompletion(operationId: string, data: any): void {
  sseService.sendEvent(operationId, 'completed', data);
  setTimeout(() => sseService.closeConnection(operationId), 1000);
}

/**
 * Send SSE error event
 */
export function sendError(operationId: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  sseService.sendEvent(operationId, 'error', { message });
  sseService.closeConnection(operationId);
}

/**
 * Find a region and its parent host in the world tree
 */
export function findRegionWithHost(
  worldsData: any,
  regionId: string
): { region: Region; host: Host; hostTreeEntry: any; regionTreeEntry: any } | null {
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
 * Includes host weather and timeOfDay for environment context
 */
export function cascadeRegionDNA(region: Region, host: Host): Region & { 
  hostDna: Host['dna']; 
  hostName: string;
  hostWeather?: string;
  hostTimeOfDay?: TimeOfDay;
} {
  return {
    ...region,
    hostDna: host.dna,
    hostName: host.name,
    hostWeather: host.weather,
    hostTimeOfDay: host.timeOfDay,
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

// ═══════════════════════════════════════════════════════════════════════════
// View Node Utilities - Shared between LOOK and EDIT_IMAGE commands
// ═══════════════════════════════════════════════════════════════════════════

/**
 * View node structure
 * Represents a different camera angle or edit of the same physical space
 */
export interface ViewNode {
  id: string;
  type: 'view';
  name: string;
  slug: string;
  description: string;
  parentId: string;
  primaryMedia?: string;
}

/**
 * Generate a slug from view name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Find tree entry for a node (to add children)
 */
export function findTreeEntry(tree: any, nodeId: string): any | null {
  if (tree.id === nodeId) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const result = findTreeEntry(child, nodeId);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Create a view node and add it to the world tree
 * Used by both LOOK and EDIT_IMAGE commands
 */
export function createViewNode(
  worldsData: any,
  parentId: string,
  name: string,
  description: string,
  mediaId: string
): ViewNode {
  const viewNode: ViewNode = {
    id: generateId(),
    type: 'view',
    name,
    slug: generateSlug(name),
    description,
    parentId,
    primaryMedia: mediaId
  };

  // Add node to nodes collection
  worldsData.nodes[viewNode.id] = viewNode;

  // Add view as child of parent node in tree structure
  for (const hostTree of worldsData.worldTrees) {
    const parentEntry = findTreeEntry(hostTree, parentId);
    if (parentEntry) {
      if (!parentEntry.children) {
        parentEntry.children = [];
      }
      parentEntry.children.push({
        id: viewNode.id,
        type: 'view',
        children: []
      });
      break;
    }
  }

  return viewNode;
}
