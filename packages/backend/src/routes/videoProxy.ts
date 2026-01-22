/**
 * Video Proxy Route
 * Proxies external video URLs with CORS headers for Three.js VideoTexture support
 * Supports HTTP Range requests for video streaming/seeking
 */

import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = Router();

/**
 * Proxy video requests to add CORS headers
 * Supports Range requests for video streaming
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

    // Build request options with Range header if present
    const requestOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {} as Record<string, string>
    };

    // Forward Range header for video seeking/streaming support
    if (req.headers.range) {
      (requestOptions.headers as Record<string, string>)['Range'] = req.headers.range;
    }

    // Make request to external video source with Range header
    const proxyReq = protocol.request(requestOptions, (proxyRes) => {
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

      // Set status code from source (206 for partial content, 200 for full)
      res.status(proxyRes.statusCode || 200);

      // Pipe the video stream directly to response
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[Video Proxy] Error fetching video:', err);
      res.status(500).json({ error: 'Failed to fetch video' });
    });

    proxyReq.end();

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
