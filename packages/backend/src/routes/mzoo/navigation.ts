/**
 * Navigation Decision Routes
 * Handles travel command analysis and routing decisions
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import * as mzooService from '../../services/mzoo.service';
import { 
  navigationDecisionPrompt, 
  NavigationDecisionRequest,
  NavigationDecision 
} from '../../engine/generation/prompts/navigation/navigationDecision';

const router = Router();

interface NavigateRequestBody {
  userCommand: string;
  currentFocus: {
    node_id: string;
    perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
    viewpoint: string;
    distance: 'close' | 'medium' | 'far';
    currentViewId?: string;
  };
  currentNode: {
    id: string;
    name: string;
    type: string;
    searchDesc?: string;
    navigableElements?: Array<{
      type: string;
      position: string;
      description: string;
    }>;
    profile?: {
      looks?: string;
      atmosphere?: string;
      searchDesc?: string;
    };
  };
  allNodes: Array<{
    id: string;
    name: string;
    type: string;
    searchDesc?: string;
  }>;
}

/**
 * POST /api/mzoo/navigation/decide
 * Analyze user's travel command and return navigation decision
 */
router.post('/decide', asyncHandler(async (req: Request, res: Response) => {
  const { userCommand, currentFocus, currentNode, allNodes }: NavigateRequestBody = req.body;

  // Validation
  if (!userCommand || !currentFocus || !currentNode || !allNodes) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: userCommand, currentFocus, currentNode, allNodes'
    });
    return;
  }

  if (!currentFocus.node_id || !currentFocus.perspective) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid focus state: node_id and perspective required'
    });
    return;
  }

  if (!currentNode.id || !currentNode.name || !currentNode.type) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid current node: id, name, and type required'
    });
    return;
  }

  if (!Array.isArray(allNodes)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'allNodes must be an array'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  // Build navigation decision request
  const request: NavigationDecisionRequest = {
    userCommand,
    currentFocus,
    currentNode,
    allNodes
  };

  // Generate prompt
  const prompt = navigationDecisionPrompt(request);

  // Call AI service
  const response = await mzooService.generateText(
    apiKey,
    [{ role: 'user', content: prompt }],
    AI_MODELS.NAVIGATOR
  );

  if (response.error || !response.data) {
    res.status(response.status).json({
      error: response.error || 'No response from AI service'
    });
    return;
  }

  // Parse AI response
  try {
    // Log raw response for debugging
    console.log('[NavigationAPI] Raw AI response:', response.data);
    console.log('[NavigationAPI] Response type:', typeof response.data);
    
    // Get the text response - handle MZOO service response structure
    const rawText = typeof response.data === 'string' 
      ? response.data 
      : (response.data.text || JSON.stringify(response.data));
    
    console.log('[NavigationAPI] Extracted text:', rawText);
    
    // Remove markdown code fences if present
    let jsonText = rawText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    console.log('[NavigationAPI] Cleaned JSON text:', jsonText);

    const decision: NavigationDecision = JSON.parse(jsonText);
    console.log('[NavigationAPI] Parsed decision:', decision);

    // Validate decision structure
    if (!decision.action || !decision.reason) {
      console.error('[NavigationAPI] Validation failed - Decision:', decision);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Invalid AI response: missing action or reason',
        receivedDecision: decision,
        rawResponse: rawText.substring(0, 500)
      });
      return;
    }

    // Validate action-specific fields
    if (decision.action === 'move' && !decision.targetNodeId) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Invalid AI response: move action requires targetNodeId'
      });
      return;
    }

    if (decision.action === 'generate' && (!decision.parentNodeId || !decision.name || !decision.scale_hint)) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Invalid AI response: generate action requires parentNodeId, name, and scale_hint'
      });
      return;
    }

    // Return decision
    res.status(HTTP_STATUS.OK).json({
      data: decision
    });
  } catch (parseError) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      rawResponse: response.data
    });
    return;
  }
}));

export { router as navigationRouter };
