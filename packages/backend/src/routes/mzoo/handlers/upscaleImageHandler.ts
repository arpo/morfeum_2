/**
 * Image Upscale Handler
 * POST /api/mzoo/navigation/upscale-image
 */

import { Request, Response } from 'express';
import { upscaleImage, hasMzooData } from '../../../services/mzoo';

/**
 * POST /api/mzoo/navigation/upscale-image
 * Upscale image using SeedVR API
 */
export async function upscaleImageHandler(req: Request, res: Response): Promise<void> {
  try {
    // Get API key from middleware (set by validateMzooApiKey)
    const apiKey = (req as any).mzooApiKey;

    const {
      inputImage,
      upscale_mode = 'factor',
      upscale_factor = 2,
      target_resolution = '1080p',
      noise_scale = 0.1,
      output_format = 'jpg'
    } = req.body;

    if (!inputImage) {
      res.status(400).json({ error: 'Missing required field: inputImage' });
      return;
    }

    // Call MZOO upscale service
    const result = await upscaleImage(
      apiKey,
      inputImage,
      upscale_mode,
      upscale_factor,
      target_resolution,
      noise_scale,
      output_format
    );

    if (!hasMzooData(result)) {
      res.status(result.status).json({ error: result.error || 'Upscale failed' });
      return;
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.error('Upscale image error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}
