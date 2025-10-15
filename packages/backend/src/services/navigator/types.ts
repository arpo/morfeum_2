/**
 * Navigator Service Types
 */

export interface FocusContext {
  node_id: string;
  perspective: string;
  viewpoint: string;
  distance: string;
}

export interface WorldNode {
  id: string;
  name: string;
  searchDesc?: string;
  depth_level: number;
  parent_location_id: string | null;
}

export interface CurrentLocationDetails {
  node_id: string;
  name: string;
  searchDesc: string;
  
  // Visual context from current location
  visualAnchors: {
    dominantElements: string[];
    uniqueIdentifiers: string[];
  };
  
  // Optional: what's in each direction (from viewDescriptions)
  viewDescriptions?: {
    [viewKey: string]: {
      looks: string;
      focusTarget: string;
    };
  };
  
  // Current view direction
  currentView: {
    viewKey: string;
    focusTarget: string;
  };
}

export interface NavigationResult {
  action: 'move' | 'generate' | 'look';
  
  // For 'move' action
  targetNodeId?: string | null;
  
  // For 'generate' action
  parentNodeId?: string | null;
  name?: string | null;
  scale_hint?: 'macro' | 'area' | 'site' | 'interior' | 'detail';
  
  // For 'look' action (prepare for future multi-view)
  viewUpdate?: {
    viewKey: string;
    needsImageGeneration: boolean;
  };
  
  relation?: 'child' | 'sibling' | 'parent' | 'distant' | null;
  reason: string;
}

export interface NavigatorResponse {
  data?: NavigationResult;
  error?: string;
  status: number;
}
