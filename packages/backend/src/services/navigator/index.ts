/**
 * ⚠️ DEPRECATED - DO NOT UPDATE
 * This code is being refactored into packages/backend/src/engine/navigation/
 * See: packages/backend/src/engine/REASSEMBLY_PLAN.md
 * 
 * Navigator Service
 * Semantic location navigation using LLM reasoning
 */

import * as mzooService from '../mzoo.service';
import { en as prompts } from '../../prompts/languages/en';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { parseAIResponse } from './processors/jsonExtractor';
import { validateNavigationResult } from './processors/idValidator';
import { ERROR_MESSAGES } from './config/constants';
import {
  FocusContext,
  CurrentLocationDetails,
  WorldNode,
  NavigationResult,
  NavigatorResponse
} from './types';

/**
 * Find destination node using NavigatorAI semantic search
 * @param apiKey - MZOO API key
 * @param userCommand - Natural language navigation command
 * @param currentFocus - Current focus state
 * @param currentLocationDetails - Visual context of current location
 * @param allNodes - All available nodes in the world
 * @returns Navigation result with action and details
 */
export async function findDestinationNode(
  apiKey: string,
  userCommand: string,
  currentFocus: FocusContext,
  currentLocationDetails: CurrentLocationDetails,
  allNodes: WorldNode[]
): Promise<NavigatorResponse> {
  try {
    // Get the prompt template with visual context
    const prompt = prompts.navigatorSemanticNodeSelector(
      userCommand,
      currentFocus,
      currentLocationDetails,
      allNodes
    );

    // Call Gemini through MZOO service
    const response = await mzooService.generateText(
      apiKey,
      [{ role: 'user', content: prompt }],
      AI_MODELS.NAVIGATOR
    );

    if (response.error || !response.data) {
      return {
        status: response.status,
        error: response.error || ERROR_MESSAGES.NO_RESPONSE
      };
    }

    // Parse JSON response
    try {
      const navigationResult = parseAIResponse<NavigationResult>(response.data);

      // Validate response structure
      if (!navigationResult.action || !navigationResult.reason) {
        return {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
        };
      }

      // Validate and fix IDs
      const validatedResult = validateNavigationResult(
        navigationResult,
        currentLocationDetails.node_id,
        allNodes
      );

      return {
        status: HTTP_STATUS.OK,
        data: validatedResult
      };
    } catch (parseError) {
      return {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error: ERROR_MESSAGES.PARSE_ERROR(parseError)
      };
    }
  } catch (error) {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: ERROR_MESSAGES.SERVICE_ERROR(error)
    };
  }
}

// Export types for consumers
export * from './types';
