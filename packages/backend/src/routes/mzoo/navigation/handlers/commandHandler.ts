/**
 * Command Handler for navigation slash commands
 * Handles /GO_INSIDE and similar navigation commands
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../../config';
import { NAVIGATION_COMMANDS, type NavigationCommand } from '../../../../config/navigation';
import { routeNavigation, buildIntentFromCommand } from '../../../../engine/navigation';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../../../engine/navigation/pipelines/createNodePipeline';
import type { NavigationContext, NavigationAnalysisResult } from '../../../../engine/navigation';
import { getStepsForPipeline } from '../../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs, generateOperationId } from '../shared';

/**
 * POST /api/mzoo/navigation/command
 * Execute a navigation command directly (without LLM classification)
 * Used for slash commands like /GO_INSIDE
 */
export async function commandHandler(req: Request, res: Response): Promise<void> {
  const { command, text, context }: { 
    command: string; 
    text?: string; 
    context: NavigationContext 
  } = req.body;

  // Validation
  if (!command || !context) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: command, context'
    });
    return;
  }

  // Validate command is a known navigation command
  if (!NAVIGATION_COMMANDS.includes(command as NavigationCommand)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Unknown navigation command: ${command}. Valid commands: ${NAVIGATION_COMMANDS.join(', ')}`
    });
    return;
  }

  if (!context.currentNode || !context.currentNode.id || !context.currentNode.type) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid context: currentNode with id and type required'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  try {
    // Build intent from command (no LLM call)
    const intent = buildIntentFromCommand(
      command as NavigationCommand,
      text || null,
      context.currentNode.type
    );

    // Route navigation using deterministic logic
    const decision = routeNavigation(intent, context);

    // Build response
    const result: NavigationAnalysisResult = {
      userCommand: `/${command}${text ? ' ' + text : ''}`,
      context,
      intent,
      decision
    };

    // Handle not implemented commands
    if (decision.action === 'not_implemented') {
      console.log(`[NAVIGATION] Command not implemented: ${command}`);
      res.status(HTTP_STATUS.OK).json({
        data: {
          ...result,
          notImplemented: true,
          message: decision.reasoning
        }
      });
      return;
    }

    // If decision is create_niche, return immediately and run pipeline asynchronously
    let navigationId: string | undefined;
    let eventsUrl: string | undefined;
    
    if (decision.action === 'create_niche') {
      navigationId = generateOperationId('nav');
      eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
      
      // Store pipeline configuration for SSE initialization
      const steps = getStepsForPipeline('navigation');
      pipelineConfigs.set(navigationId, {
        pipelineType: 'navigation',
        steps: steps.map((step, index) => ({
          index,
          id: step.id,
          name: step.name,
          duration: step.duration
        }))
      });
      
      // Return response immediately
      res.status(HTTP_STATUS.OK).json({
        data: {
          ...result,
          navigationId,
          eventsUrl
        }
      });

      // Run pipeline asynchronously
      const navId = navigationId;
      (async () => {
        try {
          await runCreateNodePipeline(decision, context, intent, apiKey, undefined, navId);
        } catch (pipelineError) {
          console.error('[NAVIGATION COMMAND ERROR]', pipelineError);
        } finally {
          pipelineConfigs.delete(navId);
        }
      })();
      
      return;
    }

    // For non-pipeline actions, return standard response
    res.status(HTTP_STATUS.OK).json({
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Navigation command failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return;
  }
}
