/**
 * Navigation System Types
 * Type definitions for the new LLM-based navigation system
 */

export type NodeType = 'host' | 'region' | 'location' | 'niche' | 'detail' | 'view';

export type NavigationIntent = 
  | 'GO_INSIDE'
  | 'GO_OUTSIDE'
  | 'GO_TO_ROOM'
  | 'GO_TO_PLACE'
  | 'LOOK_AT'
  | 'LOOK_THROUGH'
  | 'CHANGE_VIEW'
  | 'GO_UP_DOWN'
  | 'ENTER_PORTAL'
  | 'APPROACH'
  | 'EXPLORE_FEATURE'
  | 'RELOCATE'
  | 'UNKNOWN';

export interface IntentResult {
  intent: NavigationIntent;
  target: string | null;
  direction: string | null;
  newRegion?: string | null;
  relocationType?: 'macro' | 'micro' | null;
  confidence: number;
}

export interface NavigationContext {
  currentNode: {
    id: string;
    type: NodeType;
    name: string;
    parentId: string | null;
    data: {
      description?: string;
      looks?: string;
      dominantElements?: string[];
      spatialLayout?: string;
      uniqueIdentifiers?: string[];
      navigableElements?: Array<{
        type: string;
        position: string;
        description: string;
      }>;
      searchDesc?: string;
    };
    dna?: any;
  };
  parentNode?: {
    id: string;
    type: NodeType;
    name: string;
    data?: {
      description?: string;
      looks?: string;
    };
  };
  siblingNodes?: Array<{
    id: string;
    name: string;
    type: NodeType;
  }>;
  worldId?: string;
}

export type NavigationAction = 
  | 'move'
  | 'create_niche'
  | 'create_detail'
  | 'create_view'
  | 'create_hierarchy'
  | 'teleport'
  | 'unknown';

export interface NodeSpec {
  type: NodeType;
  name: string;
  parentId: string;
  metadata: {
    interior?: boolean;
    placeType?: string;
    progression?: boolean;
    [key: string]: any;
  };
}

export interface NavigationDecision {
  action: NavigationAction;
  targetNodeId?: string;
  parentNodeId?: string;
  newNodeType?: NodeType;
  newNodeName?: string;
  nodeSpecs?: NodeSpec[];
  metadata?: {
    relation?: 'child' | 'sibling' | 'parent' | 'distant';
    elevation?: 'up' | 'down';
    viewpoint?: string;
    entrance?: string;
    viewType?: 'approach' | 'detail' | 'through';
    portal?: string;
    interior?: boolean;
    progression?: boolean;
    relocationType?: 'macro' | 'micro';
    [key: string]: any;
  };
  reasoning: string;
}

export interface NavigationAnalysisResult {
  userCommand: string;
  context: NavigationContext;
  intent: IntentResult;
  decision: NavigationDecision;
}
