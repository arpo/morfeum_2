/**
 * Worlds storage routes
 */

import { Router, Request, Response } from 'express';
import { storageService, WorldsData } from '../../services/storage/storageService';

const router = Router();

/**
 * GET /worlds
 * Load all worlds from file
 */
router.get('/', async (req: Request, res: Response) => {
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
 * POST /worlds
 * Save all worlds to file
 */
router.post('/', async (req: Request, res: Response) => {
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
 * GET /worlds/check
 * Check if worlds file exists (for migration logic)
 */
router.get('/check', async (req: Request, res: Response) => {
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
 * DELETE /worlds
 * Clear all worlds data (for development/debugging)
 */
router.delete('/', async (req: Request, res: Response) => {
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

export { router as worldsRouter };
