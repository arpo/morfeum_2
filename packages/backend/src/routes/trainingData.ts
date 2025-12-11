import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import https from 'https';
import http from 'http';

const router = Router();

// Training data folder path (relative to project root)
const TRAINING_DATA_DIR = path.resolve(process.cwd(), '..', '..', 'training-data');

interface SaveTrainingDataBody {
  imageUrl: string;
  text: string;
  name: string;
  entityId: string;
}

// Sanitize filename to be filesystem-safe
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// Download image from URL and return as buffer
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// POST /api/training-data - Save training data pair
router.post('/', async (req: Request, res: Response) => {
  try {
    const { imageUrl, text, name, entityId } = req.body as SaveTrainingDataBody;
    
    if (!imageUrl || !text || !entityId) {
      res.status(400).json({ error: 'Missing required fields: imageUrl, text, entityId' });
      return;
    }
    
    // Ensure training data directory exists
    await fs.mkdir(TRAINING_DATA_DIR, { recursive: true });
    
    // Use entity ID as filename (overwrites existing files for same entity)
    const baseFilename = entityId;
    
    // Download and save image
    const imageBuffer = await downloadImage(imageUrl);
    const imagePath = path.join(TRAINING_DATA_DIR, `${baseFilename}.jpg`);
    await fs.writeFile(imagePath, imageBuffer);
    
    // Save text file
    const textPath = path.join(TRAINING_DATA_DIR, `${baseFilename}.txt`);
    await fs.writeFile(textPath, text, 'utf-8');
    
    res.json({ 
      success: true, 
      files: {
        image: `${baseFilename}.jpg`,
        text: `${baseFilename}.txt`
      }
    });
  } catch (error) {
    console.error('Error saving training data:', error);
    res.status(500).json({ error: 'Failed to save training data' });
  }
});

export default router;
