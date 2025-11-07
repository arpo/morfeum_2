/**
 * Storage Routes - API endpoints for worlds and characters persistence
 */

import { Router, Request, Response } from 'express';
import { storageService, WorldsData, CharactersData } from '../services/storage/storageService';

const router = Router();

/**
 * GET /api/worlds
 * Load all worlds from file
 */
router.get('/worlds', async (req: Request, res: Response) => {
  try {
    const worlds = await storageService.loadWorlds();
    
    if (!worlds) {
      // Return empty structure if no file exists
      return res.json({
        success: true,
        data: {
          nodes: {},
          views: {},
          worldTrees: [],
          pinnedIds: []
        }
      });
    }

    res.json({
      success: true,
      data: worlds
    });
  } catch (error) {
    console.error('[Storage API] Error loading worlds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load worlds'
    });
  }
});

/**
 * POST /api/worlds
 * Save all worlds to file
 */
router.post('/worlds', async (req: Request, res: Response) => {
  try {
    const worldsData: WorldsData = req.body;
    
    // Basic validation
    if (!worldsData || typeof worldsData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid worlds data'
      });
    }

    const saved = await storageService.saveWorlds(worldsData);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save worlds'
      });
    }

    res.json({
      success: true,
      message: 'Worlds saved successfully'
    });
  } catch (error) {
    console.error('[Storage API] Error saving worlds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save worlds'
    });
  }
});

/**
 * GET /api/worlds/check
 * Check if worlds file exists (for migration logic)
 */
router.get('/worlds/check', async (req: Request, res: Response) => {
  try {
    const hasFile = await storageService.hasWorldsFile();
    const fileInfo = await storageService.getWorldsFileInfo();
    
    res.json({
      success: true,
      hasFile,
      fileInfo
    });
  } catch (error) {
    console.error('[Storage API] Error checking worlds file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check worlds file'
    });
  }
});

/**
 * DELETE /api/worlds
 * Clear all worlds data (for development/debugging)
 */
router.delete('/worlds', async (req: Request, res: Response) => {
  try {
    const cleared = await storageService.clearWorlds();
    
    if (!cleared) {
      return res.status(500).json({
        success: false,
        error: 'Failed to clear worlds'
      });
    }

    res.json({
      success: true,
      message: 'Worlds cleared successfully'
    });
  } catch (error) {
    console.error('[Storage API] Error clearing worlds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear worlds'
    });
  }
});

// ============= CHARACTER ROUTES =============

/**
 * GET /api/characters
 * Load all characters from file
 */
router.get('/characters', async (req: Request, res: Response) => {
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
 * POST /api/characters
 * Save all characters to file
 */
router.post('/characters', async (req: Request, res: Response) => {
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
 * GET /api/characters/check
 * Check if characters file exists (for migration logic)
 */
router.get('/characters/check', async (req: Request, res: Response) => {
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
 * DELETE /api/characters
 * Clear all characters data (for development/debugging)
 */
router.delete('/characters', async (req: Request, res: Response) => {
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

export default router;
