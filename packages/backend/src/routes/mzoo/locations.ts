/**
 * Location-related routes for MZOO services
 */

import { Router } from 'express';
import { HTTP_STATUS } from '../../config';
import { generateSublocationDNA } from '../../services/sublocation.service';

const router = Router();

/**
 * POST /api/mzoo/locations/generate-sublocation
 * Generate sublocation DNA from cascaded visual context
 */
router.post('/generate-sublocation', async (req, res) => {
  try {
    const { sublocationName, cascadedContext, createImage } = req.body;
    
    // Validate required fields
    if (!sublocationName || !cascadedContext) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Missing required fields: sublocationName, cascadedContext'
      });
    }
    
    // Get API key from middleware (attached by validateMzooApiKey)
    const apiKey = (req as any).mzooApiKey;
    
    console.log('[Sublocation Generation] Generating DNA for:', sublocationName);
    
    // Generate sublocation DNA
    const sublocationDNA = await generateSublocationDNA(
      apiKey,
      sublocationName,
      cascadedContext
    );
    
    console.log('[Sublocation Generation] ✅ DNA generated successfully');
    
    res.status(HTTP_STATUS.OK).json({
      data: {
        sublocation: sublocationDNA,
        createImage // Pass through for future use
      }
    });
    
  } catch (error: any) {
    console.error('[Sublocation Generation] Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || 'Failed to generate sublocation'
    });
  }
});

export default router;
