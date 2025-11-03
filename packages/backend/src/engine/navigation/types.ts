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
  | 'UNKNOWN';

export interface IntentResult {
  intent: NavigationIntent;
  target: string | null;
  direction: string | null;
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
  | 'teleport'
  | 'unknown';

export interface NavigationDecision {
  action: NavigationAction;
  targetNodeId?: string;
  parentNodeId?: string;
  newNodeType?: NodeType;
  newNodeName?: string;
  metadata?: {
    relation?: 'child' | 'sibling' | 'parent' | 'distant';
    elevation?: 'up' | 'down';
    viewpoint?: string;
    entrance?: string;
    viewType?: 'approach' | 'detail' | 'through';
    portal?: string;
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
