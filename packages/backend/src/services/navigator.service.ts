/**
 * NavigatorAI Service
 * Semantic location navigation using LLM reasoning
 */

import * as mzooService from './mzoo.service';
import { en as prompts } from '../prompts/languages/en';
import { HTTP_STATUS, AI_MODELS } from '../config';

interface FocusContext {
  node_id: string;
  perspective: string;
  viewpoint: string;
  distance: string;
}

interface WorldNode {
  id: string;
  name: string;
  searchDesc?: string;
  depth_level: number;
  parent_location_id: string | null;
}

// NEW: Visual context for current location
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

// Enhanced navigation result
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

interface NavigatorResponse {
  data?: NavigationResult;
  error?: string;
  status: number;
}

/**
 * Find destination node using NavigatorAI semantic search
 * @param apiKey - MZOO API key
 * @param userCommand - Natural language navigation command
 * @param currentFocus - Current focus state
 * @param currentLocationDetails - Visual context of current location (NEW)
 * @param allNodes - All available nodes in the world
 * @returns Navigation result with action and details
 */
export const findDestinationNode = async (
  apiKey: string,
  userCommand: string,
  currentFocus: FocusContext,
  currentLocationDetails: CurrentLocationDetails,
  allNodes: WorldNode[]
): Promise<NavigatorResponse> => {
  try {
    // Get the prompt template (now with visual context)
    const prompt = prompts.navigatorSemanticNodeSelector(
      userCommand,
      currentFocus,
      currentLocationDetails,
      allNodes
    );

    // console.log('[NavigatorAI] Prompt size:', prompt.length, 'characters');
    // console.log('[NavigatorAI] Number of nodes:', allNodes.length);
    // console.log('[NavigatorAI] Prompt preview:', prompt.substring(0, 500));

    // Call Gemini through MZOO service
    const response = await mzooService.generateText(
      apiKey,
      [{ role: 'user', content: prompt }],
      AI_MODELS.NAVIGATOR
    );

    if (response.error || !response.data) {
      return {
        status: response.status,
        error: response.error || 'No response from AI'
      };
    }

    // Parse JSON response
    try {
      // MZOO service returns {text: "...", model: "...", usage: {}}
      // Extract the text field
      let jsonText: string;
      if (typeof response.data === 'string') {
        jsonText = response.data;
      } else if (response.data && typeof response.data === 'object' && 'text' in response.data) {
        jsonText = response.data.text;
      } else {
        jsonText = JSON.stringify(response.data);
      }
      jsonText = jsonText.trim();
      
      // console.log('[NavigatorAI] Raw AI response:', jsonText.substring(0, 500));
      
      // Extract JSON from markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.lastIndexOf('```')).trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.lastIndexOf('```')).trim();
      }

      // console.log('[NavigatorAI] Extracted JSON text:', jsonText);
      
      const navigationResult: NavigationResult = JSON.parse(jsonText);
      
      console.log('[NavigatorAI] Parsed result:', navigationResult);

      // Validate response structure
      if (!navigationResult.action || !navigationResult.reason) {
        console.error('[NavigatorAI] Missing required fields:', {
          hasAction: !!navigationResult.action,
          hasReason: !!navigationResult.reason,
          result: navigationResult
        });
        return {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          error: 'Invalid navigation result structure from AI'
        };
      }

      // CRITICAL: Validate and fix ID fields if LLM returned names instead of IDs
      // Pattern matches valid ID formats: spawn-*, subloc-*, loc-*, world-*, region-*
      const idPattern = /^(spawn|subloc|loc|world|region)-\d+-[a-z0-9]+$/;
      
      // Check targetNodeId
      if (navigationResult.targetNodeId) {
        const looksLikeId = idPattern.test(navigationResult.targetNodeId);
        if (!looksLikeId) {
          const matchedNode = allNodes.find(n => n.name === navigationResult.targetNodeId);
          if (matchedNode) {
            navigationResult.targetNodeId = matchedNode.id;
          } else {
            return {
              status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
              error: `Invalid targetNodeId: "${navigationResult.targetNodeId}" is not a valid ID and no matching node name found`
            };
          }
        }
      }

      // Check parentNodeId
      if (navigationResult.parentNodeId) {
        const looksLikeId = idPattern.test(navigationResult.parentNodeId);
        if (!looksLikeId) {
          const matchedNode = allNodes.find(n => n.name === navigationResult.parentNodeId);
          if (matchedNode) {
            console.log('[NavigatorAI] Fixed parentNodeId from name to ID:', matchedNode.id);
            navigationResult.parentNodeId = matchedNode.id;
          } else {
            // For parentNodeId, fallback to current location node ID
            console.log('[NavigatorAI] Invalid parentNodeId, using currentLocationDetails.node_id:', currentLocationDetails.node_id);
            navigationResult.parentNodeId = currentLocationDetails.node_id;
          }
        }
      }

      // Auto-fill targetNodeId for parent navigation
      if (navigationResult.relation === 'parent' && !navigationResult.targetNodeId) {
        const currentNode = allNodes.find(n => n.id === currentFocus.node_id);
        
        if (currentNode?.parent_location_id) {
          navigationResult.targetNodeId = currentNode.parent_location_id;
          console.log('[NavigatorAI] Auto-filled parent targetNodeId:', navigationResult.targetNodeId);
        } else {
          console.error('[NavigatorAI] Cannot exit: current location has no parent');
          return {
            status: HTTP_STATUS.BAD_REQUEST,
            error: 'Cannot exit: current location has no parent node'
          };
        }
      }

      return {
        status: HTTP_STATUS.OK,
        data: navigationResult
      };
    } catch (parseError) {
      console.error('[NavigatorAI] JSON parse error:', parseError);
      console.error('[NavigatorAI] Raw response:', response.data);
      return {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error: `Failed to parse AI response: ${parseError}`
      };
    }
  } catch (error) {
    console.error('[NavigatorAI] Service error:', error);
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: `Navigator service failed: ${error}`
    };
  }
};
