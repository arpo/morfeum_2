/**
 * Characters storage routes
 */

import { Router, Request, Response } from 'express';
import { storageService, CharactersData } from '../../services/storage/storageService';

const router = Router();

/**
 * GET /characters
 * Load all characters from file
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const characters = await storageService.loadCharacters();
    
    if (!characters) {
      // Return empty structure if no file exists
      return res.json({
        success: true,
        data: {
          characters: {},
          pinnedIds: []
        }
      });
    }

    res.json({
      success: true,
      data: characters
    });
  } catch (error) {
    console.error('[Storage API] Error loading characters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load characters'
    });
  }
});

/**
 * POST /characters
 * Save all characters to file
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const charactersData: CharactersData = req.body;
    
    // Basic validation
    if (!charactersData || typeof charactersData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid characters data'
      });
    }

    const saved = await storageService.saveCharacters(charactersData);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save characters'
      });
    }

    res.json({
      success: true,
      message: 'Characters saved successfully'
    });
  } catch (error) {
    console.error('[Storage API] Error saving characters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save characters'
    });
  }
});

/**
 * GET /characters/check
 * Check if characters file exists (for migration logic)
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    const hasFile = await storageService.hasCharactersFile();
    const fileInfo = await storageService.getCharactersFileInfo();
    
    res.json({
      success: true,
      hasFile,
      fileInfo
    });
  } catch (error) {
    console.error('[Storage API] Error checking characters file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check characters file'
    });
  }
});

/**
 * DELETE /characters
 * Clear all characters data (for development/debugging)
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const cleared = await storageService.clearCharacters();
    
    if (!cleared) {
      return res.status(500).json({
        success: false,
        error: 'Failed to clear characters'
      });
    }

    res.json({
      success: true,
      message: 'Characters cleared successfully'
    });
  } catch (error) {
    console.error('[Storage API] Error clearing characters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear characters'
    });
  }
});

export { router as charactersRouter };
