/**
 * Navigation Assistant Chat Handler
 * 
 * Handles chat requests to the navigation assistant LLM.
 * Uses the navigation assistant system prompt to provide expert guidance
 * on Morfeum navigation commands.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, AI_MODELS } from '../../config';
import { generateText, hasMzooData } from '../../services/mzoo';
import { buildNavigationAssistantPrompt, buildNavigationContext } from '../prompts/navigationAssistant';

/**
 * Chat message structure
 */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Request body for navigation assistant chat
 */
interface NavigationAssistantRequest {
  messages: ChatMessage[];
  context?: {
    currentNodeName?: string;
    currentNodeType?: string;
    currentNodeDescription?: string;
    parentContainerName?: string;
    nodeId?: string;
    imagePrompt?: string;
  };
}

/**
 * Check if troubleshooting mode is enabled via environment variable
 */
function isTroubleshootingEnabled(): boolean {
  const envValue = process.env.NAVIGATION_ASSISTANT_TROUBLESHOOTING;
  // Default to true if not set, false if explicitly set to 'false'
  return envValue !== 'false';
}

export const navigationAssistantHandler = asyncHandler(async (req: Request, res: Response) => {
  const { messages, context } = req.body as NavigationAssistantRequest;

  // Validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing or invalid messages array'
    });
    return;
  }

  const apiKey = (req as any).mzooApiKey;
  if (!apiKey) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Missing API key'
    });
    return;
  }

  try {
    // Build the system prompt
    const includeTroubleshooting = isTroubleshootingEnabled();
    const systemPrompt = buildNavigationAssistantPrompt(includeTroubleshooting);
    
    // Build context section if provided
    let contextSection = '';
    if (context) {
      contextSection = '\n\n' + buildNavigationContext(context);
    }

    // Prepare messages for LLM
    const llmMessages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt + contextSection
      },
      ...messages
    ];

    // Call LLM
    const result = await generateText(
      apiKey,
      llmMessages.map(m => ({ role: m.role, content: m.content })),
      AI_MODELS.SEED_GENERATION // Use the same model as other navigation features
    );

    if (!hasMzooData(result)) {
      throw new Error(result.error || 'Failed to generate response');
    }

    res.status(HTTP_STATUS.OK).json({
      data: {
        message: result.data.text
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: errorMessage
    });
  }
});
