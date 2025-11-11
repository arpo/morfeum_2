/**
 * Location Navigation Utility
 * Handles NavigatorAI API calls and spatial navigation logic
 */

import { Node } from '@/store/slices/locations';
import { getMergedDNA } from '@/utils/nodeDNAExtractor';

interface FocusState {
  node_id: string;
  perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
  viewpoint: string;
  distance: 'close' | 'medium' | 'far';
}

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

interface SpatialNode {
  id: string;
  name: string;
  dna: any;
  searchDesc: string;
  depth_level: number;
  parent_location_id: string | null;
}

interface NavigationResult {
  action: 'move' | 'generate';
  targetNodeId?: string;
  parentNodeId?: string;
  name?: string;
  scale_hint?: string;
  relation?: string;
  reason: string;
  imageUrl?: string;
  imagePrompt?: string;
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
    const worldTree = worldTrees.find(tree => {
      const findInTree = (treeNode: any, targetId: string): boolean => {
        if (treeNode.id === targetId) return true;
        return treeNode.children?.some((child: any) => findInTree(child, targetId)) || false;
      };
      return findInTree(tree, node.id);
    });
    
    let depth_level = 0;
    let parent_location_id: string | null = null;
    
    // Get tree path to find parent and depth
    if (worldTree) {
      const getPath = (treeNode: any, targetId: string, path: string[] = []): string[] | null => {
        path.push(treeNode.id);
        if (treeNode.id === targetId) return path;
        
        for (const child of treeNode.children || []) {
          const found = getPath(child, targetId, [...path]);
          if (found) return found;
        }
        return null;
      };
      
      const path = getPath(worldTree, node.id);
      if (path) {
        depth_level = path.length - 1;
        parent_location_id = path.length > 1 ? path[path.length - 2] : null;
      }
    }
    
    return {
      id: node.id,
      name: node.name,
      dna: node.dna,
      searchDesc,
      depth_level,
      parent_location_id
    };
  });
}

/**
 * Call new Navigation Analysis API
 * Uses LLM for intent classification + deterministic routing
 */
export async function findDestination(
  userCommand: string,
  currentNode: Node,
  spatialNodes: SpatialNode[],
  getCascadedDNA: (nodeId: string) => any
): Promise<NavigationResult> {
  // Extract data from currentNode DNA
  const nodeDNA = (currentNode.dna || {}) as Record<string, any>;
  const { dna: _currentNestedDNA, ...currentNodeBaseData } = nodeDNA;
  
  // Find parent node from spatialNodes (parent has this node as a child in tree)
  const currentSpatialNode = spatialNodes.find(node => node.id === currentNode.id);
  const parentNodeData = currentSpatialNode?.parent_location_id 
    ? spatialNodes.find(node => node.id === currentSpatialNode.parent_location_id)
    : undefined;
  
  // Get cascaded DNA and merge for LLM usage (inherits parent values)
  const currentCascadedDNA = getCascadedDNA(currentNode.id);
  const currentMergedDNA = getMergedDNA(currentCascadedDNA);
  const currentNodeDataForContext = {
    ...currentNodeBaseData
  };
  
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
  
  // Build context for new navigation system with merged DNA
  const context = {
    currentNode: {
      id: currentNode.id,
      type: 'location' as const,
      name: currentNode.name,
      parentId: currentSpatialNode?.parent_location_id || null,
      data: currentNodeDataForContext,
      dna: currentMergedDNA  // Merged DNA with inheritance
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
      type: 'location' as const
    }))
  };
  
  // Call new navigation analysis endpoint
  const response = await fetch('/api/mzoo/navigation/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userCommand: userCommand.trim(),
      context
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Navigation API Error:', error);
    throw new Error(`Navigation API failed: ${error.error || 'Unknown error'}`);
  }
  
  const result = await response.json();
  
  // Log navigation analysis to browser console
  console.log(' ═══════════════════════════════════════════════════');
  console.log(' NAVIGATION ANALYSIS');
  console.log(' ═══════════════════════════════════════════════════');
  console.log(' User Command:', result.data.userCommand);
  console.log('');
  console.log(' Intent Classification:');
  console.log('  Intent:', result.data.intent.intent);
  console.log('  Target:', result.data.intent.target || 'none');
  console.log('  Direction:', result.data.intent.direction || 'none');
  console.log('  Space Type:', result.data.intent.spaceType || 'not classified');
  console.log('  Confidence:', result.data.intent.confidence);
  console.log('');
  console.log('⚡ Navigation Decision:');
  console.log('  Action:', result.data.decision.action);
  console.log('  New Node Type:', result.data.decision.newNodeType || 'N/A');
  console.log('  New Node Name:', result.data.decision.newNodeName || 'N/A');
  console.log('  Parent Node ID:', result.data.decision.parentNodeId || 'N/A');
  console.log('  Target Node ID:', result.data.decision.targetNodeId || 'N/A');
  console.log('  Metadata:', JSON.stringify(result.data.decision.metadata) || {});
  console.log('  Reasoning:', result.data.decision.reasoning);
  console.log('');
  console.log(' Context Used:');
  console.log('  Current Node:', result.data.context.currentNode.name);
  console.log('  Node Type:', result.data.context.currentNode.type);
  console.log('  Dominant Elements:', result.data.context.currentNode.data.dominantElements);
  console.log(' ═══════════════════════════════════════════════════');
  
  // Convert to legacy format for compatibility
  const navigation: NavigationResult = {
    action: result.data.decision.action === 'create_niche' || 
            result.data.decision.action === 'create_detail' ||
            result.data.decision.action === 'teleport' ? 'generate' : 
            result.data.decision.action,
    targetNodeId: result.data.decision.targetNodeId,
    parentNodeId: result.data.decision.parentNodeId,
    name: result.data.decision.newNodeName,
    scale_hint: result.data.decision.newNodeType,
    relation: result.data.decision.metadata?.relation,
    reason: result.data.decision.reasoning,
    imageUrl: result.data.imageUrl,
    imagePrompt: result.data.imagePrompt
  };
  
  return navigation;
  
  
}
