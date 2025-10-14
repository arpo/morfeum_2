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

interface NavigationResult {
  action: 'move' | 'generate';
  targetNodeId: string | null;
  parentNodeId?: string | null;
  name: string | null;
  relation: 'sublocation' | 'adjacent' | 'nearby' | 'parent' | 'teleport' | null;
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
 * @param allNodes - All available nodes in the world
 * @returns Navigation result with action and details
 */
export const findDestinationNode = async (
  apiKey: string,
  userCommand: string,
  currentFocus: FocusContext,
  allNodes: WorldNode[]
): Promise<NavigatorResponse> => {
  try {
    // Get the prompt template
    const prompt = prompts.navigatorSemanticNodeSelector(
      userCommand,
      currentFocus,
      allNodes
    );

    console.log('[NavigatorAI] Prompt size:', prompt.length, 'characters');
    console.log('[NavigatorAI] Number of nodes:', allNodes.length);
    console.log('[NavigatorAI] Prompt preview:', prompt.substring(0, 500));

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
      
      console.log('[NavigatorAI] Raw AI response:', jsonText.substring(0, 500));
      
      // Extract JSON from markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.lastIndexOf('```')).trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.lastIndexOf('```')).trim();
      }

      console.log('[NavigatorAI] Extracted JSON text:', jsonText);
      
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
