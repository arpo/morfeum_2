/**
 * Command Handler
 * POST /api/mzoo/navigation/command
 * Execute a navigation command directly (without LLM classification)
 * Used for slash commands like /GO_INSIDE, /GOTO, etc.
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import { NAVIGATION_COMMANDS, type NavigationCommand } from '../../../config/navigation';
import { routeNavigation, buildIntentFromCommand } from '../../../engine/navigation';
import type { RouteOptions, NavigationContext, NavigationAnalysisResult } from '../../../engine/navigation';
import { parseEnhancements } from '../../../engine/navigation/utils/enhancementParser';
import { handleGotoCommand } from './gotoHandler';
import { handleCreateCharacter } from './characterHandler';
import { handleCreateNiche } from './nicheHandler';

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

  // Block commands on pass-through regions
  if (context.currentNode.data?.isPassThrough) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Commands cannot be run on pass-through regions. Navigate to a location first.'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  try {
    // Parse enhancements from text (navigable elements, furnish, facade, perspective flags)
    const parsed = parseEnhancements(text || '');
    const cleanText = parsed.cleanCommand || undefined;
    
    // DEBUG: Log parsed perspective override
    console.log(`[PERSPECTIVE DEBUG] Command: ${command}, Raw text: "${text}"`);
    console.log(`[PERSPECTIVE DEBUG] Parsed perspectiveOverride: ${parsed.perspectiveOverride}`);
    
    // Build intent from command with CLEAN text (enhancements removed)
    // Pass perspectiveOverride if user specified --interior, --exterior, or --open-air
    const intent = buildIntentFromCommand(
      command as NavigationCommand,
      cleanText || null,
      context.currentNode.type,
      parsed.perspectiveOverride  // User-specified perspective flag
    );
    
    // DEBUG: Log intent spaceType
    console.log(`[PERSPECTIVE DEBUG] intent.spaceType after buildIntentFromCommand: ${intent.spaceType}`);

    // Build parsedEnhancements for pipeline
    const parsedEnhancements = (parsed.navigableElements || parsed.furnishing) ? {
      navigableElements: parsed.navigableElements,
      furnishing: parsed.furnishing
    } : undefined;

    // For GOTO: Send response immediately, run analysis in pipeline
    // Context-aware: from niche = sibling niche, from location = sibling location
    if (command === 'GOTO' && cleanText) {
      await handleGotoCommand(req, res, context, intent, cleanText, parsedEnhancements, apiKey);
      return;
    }

    // For non-GOTO commands, run normal flow
    const routeOptions: RouteOptions = {};
    const decision = routeNavigation(intent, context, routeOptions);

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

    // Handle create_character action (CREATE_CHARACTER_REAL / CREATE_CHARACTER_UNREAL)
    if (decision.action === 'create_character') {
      await handleCreateCharacter(res, result, decision, context, apiKey);
      return;
    }

    // If decision is create_niche (e.g., GO_INSIDE), return immediately and run pipeline asynchronously
    if (decision.action === 'create_niche') {
      await handleCreateNiche(res, result, decision, context, intent, cleanText, parsedEnhancements, apiKey);
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
