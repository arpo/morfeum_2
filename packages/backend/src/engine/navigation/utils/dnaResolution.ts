/**
 * DNA Resolution Utilities
 * Functions for resolving parent DNA in navigation commands
 */

import type { NavigationContext } from '../types';
import { getResolvedNodeDNA, resolveAncestryDNASkippingPassThrough } from '../../hierarchyAnalysis/dnaMerge';
import { findParentLocationNode, findParentRegionNode } from './parentResolution';
import { findHostForRegion } from './treeTraversal';

/**
 * World tree node structure for DNA resolution
 */
interface WorldTreeNode {
  id: string;
  type: string;
  children?: WorldTreeNode[];
}

/**
 * World data structure for DNA resolution
 */
interface WorldsData {
  nodes: Record<string, any>;
  worldTrees: WorldTreeNode[];
}

/**
 * Result from DNA resolution
 */
export interface DNAResolutionResult {
  /** Parent node ID for tree attachment */
  parentNodeId: string;
  /** Fully resolved/cascaded parent DNA */
  resolvedParentDNA: any | null;
  /** Type of node being created */
  targetNodeType: 'location' | 'niche';
}

/**
 * Resolve parent DNA for navigation commands (GOTO and GO_INSIDE)
 * Consolidates DNA resolution logic into a single source of truth
 * 
 * Handles:
 * - GOTO from location → sibling location under parent region (uses region/host DNA)
 * - GOTO from niche → sibling niche under parent location (uses cascaded location DNA)
 * - GO_INSIDE from location → child niche under current location
 * - GO_INSIDE from niche → child niche under current niche (infinite depth)
 * 
 * @param command - The navigation command ('GOTO' or 'GO_INSIDE')
 * @param context - Navigation context with current/parent node info
 * @param worldsData - World data with nodes and trees for DNA lookup
 * @returns DNAResolutionResult with parentNodeId, resolvedParentDNA, and targetNodeType
 */
export function resolveNavigationParentDNA(
  command: 'GOTO' | 'GO_INSIDE',
  context: NavigationContext,
  worldsData: WorldsData
): DNAResolutionResult {
  const currentNodeType = context.currentNode.type;
  
  // GO_INSIDE: Creates child niche under CURRENT node (location or niche)
  // This enables infinite niche depth - niches can contain niches
  if (command === 'GO_INSIDE') {
    const currentNodeId = context.currentNode.id;
    
    // CRITICAL: Use getResolvedNodeDNA to get the CURRENT NODE's DNA merged with ancestry
    // This ensures that when entering "The Oracle's Spire" (location), we use the LOCATION's
    // DNA (e.g., "Organic futuristic", "Iridescent jewel tones"), not just the region's DNA.
    // 
    // Previously used resolveAncestryDNASkippingPassThrough which only got ANCESTOR DNA,
    // completely ignoring the current node's own DNA characteristics.
    const resolvedParentDNA = getResolvedNodeDNA(
      currentNodeId,
      worldsData.nodes,
      worldsData.worldTrees
    );
    
    return {
      parentNodeId: currentNodeId,  // Use current node as parent (not parent location)
      resolvedParentDNA,
      targetNodeType: 'niche'
    };
  }
  
  // GOTO: Context-aware - creates sibling at same level
  if (currentNodeType === 'location') {
    // GOTO from location: create sibling location under parent region
    const { parentRegionId } = findParentRegionNode(context);
    const parentRegionNode = worldsData.nodes[parentRegionId];
    
    let resolvedParentDNA: any = null;
    
    if (parentRegionNode) {
      // Check if region is pass-through (use host DNA instead)
      const isPassThrough = parentRegionNode.isPassThrough || 
        (parentRegionNode.type === 'region' && (!parentRegionNode.dna || Object.keys(parentRegionNode.dna).length === 0));
      
      if (isPassThrough) {
        // Find host and use its DNA
        const hostNode = findHostForRegion(parentRegionId, worldsData.worldTrees, worldsData.nodes);
        if (hostNode?.dna) {
          resolvedParentDNA = hostNode.dna;
        }
      } else if (parentRegionNode.dna) {
        resolvedParentDNA = parentRegionNode.dna;
      }
    }
    
    return {
      parentNodeId: parentRegionId,
      resolvedParentDNA,
      targetNodeType: 'location'
    };
  }
  
  // GOTO from niche: create sibling niche under parent location
  const { parentLocationId } = findParentLocationNode(context);
  
  // Use cascaded DNA resolution for full ancestry inheritance (Host → Region → Location)
  const resolvedParentDNA = getResolvedNodeDNA(
    parentLocationId,
    worldsData.nodes,
    worldsData.worldTrees
  );
  
  return {
    parentNodeId: parentLocationId,
    resolvedParentDNA,
    targetNodeType: 'niche'
  };
}

/**
 * Determine if destination analysis should run for a command
 * GOTO always needs it, GO_INSIDE never needs it
 * 
 * @param command - The navigation command
 * @param userPrompt - User's destination description
 * @returns true if destination analysis should run
 */
export function shouldRunDestinationAnalysis(
  command: 'GOTO' | 'GO_INSIDE',
  userPrompt: string
): boolean {
  // GOTO always benefits from destination analysis
  if (command === 'GOTO') {
    return true;
  }
  
  // GO_INSIDE: Never run destination analysis
  // The command itself defines the intent (create interior space)
  return false;
}
