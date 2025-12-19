/**
 * Enhance Prompt Handler
 * POST /api/mzoo/navigation/enhance-prompt
 * Generate enhancement suggestions (navigable elements, furnishing, facade) for a command
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import { storageService } from '../../../services/storage/storageService';
import { enhancePrompt } from '../../../services/mzoo/promptEnhancer';

export async function enhancePromptHandler(req: Request, res: Response): Promise<void> {
  const { command, text, nodeId, perspectiveOverride } = req.body as {
    command: string;
    text: string;
    nodeId: string;
    perspectiveOverride?: 'interior' | 'exterior' | 'open-air';
  };

  // Validation
  if (!command || !nodeId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: command, nodeId'
    });
    return;
  }

  // Validate command is one that supports enhancement
  const enhanceableCommands = ['GO_INSIDE', 'GOTO', 'NEW_LOCATION'];
  if (!enhanceableCommands.includes(command)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Command ${command} does not support enhancement. Valid commands: ${enhanceableCommands.join(', ')}`
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  try {
    // Load node data
    const worldsData = await storageService.loadWorlds();
    if (!worldsData || !worldsData.nodes) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'No worlds data found'
      });
      return;
    }

    const node = worldsData.nodes[nodeId];
    if (!node) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: `Node not found: ${nodeId}`
      });
      return;
    }

    console.log(`[ENHANCE-PROMPT] Generating enhancement for ${command} at "${node.name}"`);
    console.log(`[ENHANCE-PROMPT] Destination text: "${text || '(none)'}"`);

    // Call prompt enhancer service
    const result = await enhancePrompt(apiKey, {
      commandType: command as 'GO_INSIDE' | 'GOTO' | 'NEW_LOCATION',
      destinationText: text || '',
      currentNode: {
        id: node.id,
        name: node.name,
        type: node.type,
        description: node.description,
        spaceType: node.spaceType,  // Pass spaceType for perspective detection
        dna: node.dna,
        navigableElements: node.navigableElements || node.structure?.navigableElements,
        dominantElements: node.dominantElements || node.structure?.dominantElements
      },
      perspectiveOverride  // Pass user's --exterior, --interior, --open-air flag
    });

    if (!result.success) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: result.error || 'Failed to generate enhancement'
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      data: {
        enhancement: result.enhancement
      }
    });
  } catch (error) {
    console.error('[ENHANCE-PROMPT ERROR]', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
