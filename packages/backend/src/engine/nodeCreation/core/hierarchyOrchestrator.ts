/**
 * Hierarchy Orchestrator
 * 
 * Main orchestration logic for creating full node hierarchies.
 * Extracted from createHierarchy.ts for maintainability.
 */

import type {
  HierarchySpec,
  CreateHierarchyOptions,
  CreateHierarchyResult,
  Node,
  HostNode,
  RegionNode,
  LocationNode,
  NicheNode,
  ParentDNAContext,
} from '../types';
import { createNode } from './createNode';
import { extractParentDNAContext, getNodeDepth } from './dnaInheritance';
import { getDeepestNodeType, countNodes, createPassThroughRegion } from './hierarchyHelpers';

/**
 * Create a full hierarchy from a specification
 * 
 * Creates nodes sequentially, inheriting DNA from parent to child.
 * Image is generated only on the deepest node.
 * 
 * @param spec - Hierarchy specification with node descriptions
 * @param options - Creation options
 * @returns Created hierarchy with all nodes
 */
export async function createHierarchy(
  spec: HierarchySpec,
  options: CreateHierarchyOptions
): Promise<CreateHierarchyResult> {
  const { apiKey, spawnId, createImage = true, signal } = options;

  const nodes: Node[] = [];
  const deepestType = getDeepestNodeType(spec);
  const nodeCount = countNodes(spec);

  let parentContext: ParentDNAContext = {};
  let hostNode: HostNode | undefined;
  let regionNode: RegionNode | undefined;
  let locationNode: LocationNode | undefined;
  let nicheNode: NicheNode | undefined;
  let imageUrl: string | undefined;
  let imagePrompt: string | undefined;

  // Step 1: Create Host (if specified)
  if (spec.host) {
    if (signal?.aborted) throw new Error('Aborted');

    const isDeepest = deepestType === 'host';
    const result = await createNode('host', spec.host, {
      apiKey,
      spawnId,
      parentContext, // Pass parent context (empty for host)
      createImage: isDeepest && createImage,
    });

    hostNode = result.node as HostNode;
    nodes.push(hostNode);
    parentContext = extractParentDNAContext(hostNode.dna);

    if (isDeepest) {
      imageUrl = result.imageUrl;
      imagePrompt = result.imagePrompt;
    }
  }

  // Step 2: Create Region (if specified)
  if (spec.region) {
    if (signal?.aborted) throw new Error('Aborted');

    const isDeepest = deepestType === 'region';
    
    // Check if this should be a pass-through region
    if (spec.regionIsPassThrough) {
      // Create minimal pass-through region WITHOUT LLM call
      regionNode = createPassThroughRegion(hostNode?.id);
      nodes.push(regionNode);
      
      // Attach to host
      if (hostNode) {
        hostNode.regions = hostNode.regions || [];
        hostNode.regions.push(regionNode);
      }
      
      // Pass-through region doesn't modify parentContext - keeps host's context
      // (This is the key difference - DNA flows straight through)
    } else {
      // Create real region with LLM-generated DNA
      const result = await createNode('region', spec.region, {
        apiKey,
        spawnId,
        parentId: hostNode?.id,
        parentContext, // Pass inherited context from host
        createImage: isDeepest && createImage,
      });

      regionNode = result.node as RegionNode;
      nodes.push(regionNode);

      // Attach to host
      if (hostNode) {
        hostNode.regions = hostNode.regions || [];
        hostNode.regions.push(regionNode);
      }

      parentContext = extractParentDNAContext(regionNode.dna);

      if (isDeepest) {
        imageUrl = result.imageUrl;
        imagePrompt = result.imagePrompt;
      }
    }
  }

  // Step 3: Create Location (if specified)
  if (spec.location) {
    if (signal?.aborted) throw new Error('Aborted');

    const isDeepest = deepestType === 'location';
    const result = await createNode('location', spec.location, {
      apiKey,
      spawnId,
      parentId: regionNode?.id,
      parentContext, // Pass inherited context from region
      createImage: isDeepest && createImage,
    });

    locationNode = result.node as LocationNode;
    nodes.push(locationNode);

    // Attach to region
    if (regionNode) {
      regionNode.locations = regionNode.locations || [];
      regionNode.locations.push(locationNode);
    }

    parentContext = extractParentDNAContext(locationNode.dna);

    if (isDeepest) {
      imageUrl = result.imageUrl;
      imagePrompt = result.imagePrompt;
    }
  }

  // Step 4: Create Niche (if specified)
  if (spec.niche) {
    if (signal?.aborted) throw new Error('Aborted');

    const isDeepest = deepestType === 'niche';
    const result = await createNode('niche', spec.niche, {
      apiKey,
      spawnId,
      parentId: locationNode?.id,
      parentContext, // Pass inherited context from location
      createImage: isDeepest && createImage,
    });

    nicheNode = result.node as NicheNode;
    nodes.push(nicheNode);

    // Attach to location
    if (locationNode) {
      locationNode.niches = locationNode.niches || [];
      locationNode.niches.push(nicheNode);
    }

    if (isDeepest) {
      imageUrl = result.imageUrl;
      imagePrompt = result.imagePrompt;
    }
  }

  // Get root node (always the first created node)
  const rootNode = (hostNode || regionNode || locationNode || nicheNode) as HostNode;

  if (!rootNode) {
    throw new Error('No nodes were created - spec was empty');
  }

  return {
    rootNode,
    nodes,
    imageUrl,
    imagePrompt,
    depth: getNodeDepth(deepestType),
  };
}
