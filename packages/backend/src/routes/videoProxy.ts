/**
 * Video Proxy Route
 * Proxies external video URLs with CORS headers for Three.js VideoTexture support
 */

import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = Router();

/**
 * Proxy video requests to add CORS headers
 * GET /api/proxy/video?url=<video-url>
 */
router.get('/video', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Parse the URL to determine protocol
    const parsedUrl = new URL(videoUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    // Make request to external video source
    protocol.get(videoUrl, (proxyRes) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

      // Forward important headers from the source
      if (proxyRes.headers['content-type']) {
        res.setHeader('Content-Type', proxyRes.headers['content-type']);
      }
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }
      if (proxyRes.headers['content-range']) {
        res.setHeader('Content-Range', proxyRes.headers['content-range']);
      }
      if (proxyRes.headers['accept-ranges']) {
        res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges']);
      }

      // Set status code from source
      res.status(proxyRes.statusCode || 200);

      // Pipe the video stream directly to response
      proxyRes.pipe(res);
    }).on('error', (err) => {
      console.error('[Video Proxy] Error fetching video:', err);
      res.status(500).json({ error: 'Failed to fetch video' });
    });

  } catch (err) {
    console.error('[Video Proxy] Invalid URL:', err);
    res.status(400).json({ error: 'Invalid video URL' });
  }
});

// Handle OPTIONS preflight requests
router.options('/video', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.status(200).send();
});

export default router;
