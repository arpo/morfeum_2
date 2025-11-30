/**
 * Navigation Context Utilities
 * Builds context data for NavigatorAI API calls
 */

import { Node } from '@/store/slices/locations';

interface CurrentLocationDetails {
  node_id: string;
  name: string;
  searchDesc: string;
  visualAnchors: {
    dominantElements: string[];
    uniqueIdentifiers: string[];
  };
  currentView: {
    viewKey: string;
    focusTarget: string;
  };
}

export interface SpatialNode {
  id: string;
  name: string;
  type: string;
  dna: any;
  searchDesc: string;
  depth_level: number;
  parent_location_id: string | null;
}

/**
 * Build current location details with visual context for NavigatorAI
 */
export function buildCurrentLocationDetails(currentNode: Node): CurrentLocationDetails {
  const nodeDNA = currentNode.dna as any;
  
  // Extract visualAnchors from DNA (flat NodeDNA structure)
  const visualAnchors = nodeDNA.visualAnchors || {
    dominantElements: [],
    uniqueIdentifiers: []
  };
  
  // Extract searchDesc
  const searchDesc = nodeDNA.searchDesc || nodeDNA.profile?.searchDesc || currentNode.name;
  
  return {
    node_id: currentNode.id,
    name: currentNode.name,
    searchDesc,
    visualAnchors: {
      dominantElements: visualAnchors.dominantElements || [],
      uniqueIdentifiers: visualAnchors.uniqueIdentifiers || []
    },
    currentView: {
      viewKey: 'default',
      focusTarget: currentNode.name
    }
  };
}

/**
 * Find the tree path to a node
 */
function getTreePath(tree: any, nodeId: string, path: string[] = []): string[] | null {
  path.push(tree.id);
  if (tree.id === nodeId) return path;
  
  for (const child of tree.children || []) {
    const found = getTreePath(child, nodeId, [...path]);
    if (found) return found;
  }
  return null;
}

/**
 * Find if a node exists in a tree
 */
function findInTree(treeNode: any, targetId: string): boolean {
  if (treeNode.id === targetId) return true;
  return treeNode.children?.some((child: any) => findInTree(child, targetId)) || false;
}

/**
 * Build spatial nodes list for NavigatorAI with tree traversal
 */
export function buildSpatialNodes(
  spatialNodes: Node[],
  worldTrees: any[]
): SpatialNode[] {
  return spatialNodes.map(node => {
    // Extract searchDesc from node's DNA based on type
    let searchDesc = node.name;
    const dna = node.dna as any;
    
    if (dna.profile?.searchDesc) {
      searchDesc = dna.profile.searchDesc;
    }
    
    // Find world tree containing this node
    const worldTree = worldTrees.find(tree => findInTree(tree, node.id));
    
    let depth_level = 0;
    let parent_location_id: string | null = null;
    
    // Get tree path to find parent and depth
    if (worldTree) {
      const path = getTreePath(worldTree, node.id);
      if (path) {
        depth_level = path.length - 1;
        parent_location_id = path.length > 1 ? path[path.length - 2] : null;
      }
    }
    
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      dna: node.dna,
      searchDesc,
      depth_level,
      parent_location_id
    };
  });
}

/**
 * Build navigation context for API call
 */
export function buildNavigationContext(
  currentNode: Node,
  spatialNodes: SpatialNode[],
  getCascadedDNA: (nodeId: string) => any,
  getMergedDNA: (cascadedDNA: any) => any
): {
  currentNode: any;
  parentNode: any | undefined;
  siblingNodes: { id: string; name: string; type: string }[];
} {
  // Extract data from currentNode DNA
  const nodeDNA = (currentNode.dna || {}) as Record<string, any>;
  const { dna: _currentNestedDNA, ...currentNodeBaseData } = nodeDNA;
  
  // Find parent node from spatialNodes
  const currentSpatialNode = spatialNodes.find(node => node.id === currentNode.id);
  const parentNodeData = currentSpatialNode?.parent_location_id 
    ? spatialNodes.find(node => node.id === currentSpatialNode.parent_location_id)
    : undefined;
  
  // Get cascaded DNA and merge for LLM usage
  const currentCascadedDNA = getCascadedDNA(currentNode.id);
  const currentMergedDNA = getMergedDNA(currentCascadedDNA);
  const currentNodeDataForContext = { ...currentNodeBaseData };
  
  const parentRawDNA = parentNodeData
    ? ((parentNodeData.dna || {}) as Record<string, any>)
    : undefined;
  const parentMergedDNA = parentNodeData
    ? getMergedDNA(getCascadedDNA(parentNodeData.id))
    : undefined;
    
  let parentNodeDataForContext: Record<string, any> | undefined;
  if (parentRawDNA) {
    parentNodeDataForContext = { ...parentRawDNA };
    delete parentNodeDataForContext.dna;
  }
  
  return {
    currentNode: {
      id: currentNode.id,
      type: currentNode.type,
      name: currentNode.name,
      parentId: currentSpatialNode?.parent_location_id || null,
      data: currentNodeDataForContext,
      dna: currentMergedDNA
    },
    parentNode: parentNodeData ? {
      id: parentNodeData.id,
      type: 'location' as const,
      name: parentNodeData.name,
      data: parentNodeDataForContext,
      dna: parentMergedDNA
    } : undefined,
    siblingNodes: spatialNodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type || 'location'
    }))
  };
}
