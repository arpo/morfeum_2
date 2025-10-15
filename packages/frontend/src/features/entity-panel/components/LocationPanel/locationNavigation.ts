/**
 * Location Navigation Utility
 * Handles NavigatorAI API calls and spatial navigation logic
 */

import { Node } from '@/store/slices/locationsSlice';

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
  
  // Extract viewContext
  const viewContext = nodeDNA.viewContext || nodeDNA.profile?.viewContext || {
    focusTarget: currentNode.name
  };
  
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
      focusTarget: viewContext.focusTarget || currentNode.name
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
 * Call NavigatorAI API to find destination
 */
export async function findDestination(
  userCommand: string,
  currentFocus: FocusState,
  currentLocationDetails: CurrentLocationDetails,
  spatialNodes: SpatialNode[]
): Promise<NavigationResult> {
  console.log('[NavigatorAI] 🎯 Visual context:', {
    dominantElements: currentLocationDetails.visualAnchors.dominantElements,
    currentView: currentLocationDetails.currentView.focusTarget
  });
  
  const response = await fetch('/api/mzoo/navigator/find-destination', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userCommand: userCommand.trim(),
      currentFocus,
      currentLocationDetails,
      allNodes: spatialNodes
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // Display user-friendly error for top-level exit attempts
    if (error.error && error.error.includes("already at the top level")) {
      console.log('[NavigatorAI]', error.error);
      throw new Error('ALREADY_AT_TOP_LEVEL');
    }
    
    console.error('[NavigatorAI] API error:', error);
    throw new Error(`Navigation API failed: ${error.error || 'Unknown error'}`);
  }
  
  const result = await response.json();
  const navigation = result.data;
  
  console.log('[NavigatorAI] ✅ Navigation Result:', {
    action: navigation.action,
    name: navigation.name,
    scale_hint: navigation.scale_hint,
    relation: navigation.relation,
    reason: navigation.reason
  });
  
  return navigation;
}
