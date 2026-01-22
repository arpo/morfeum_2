/**
 * R2 Storage Service
 * 
 * Handles uploading files to Cloudflare R2 storage via MZOO API.
 * Used for permanent storage of generated videos.
 */

import mediaService from './media/mediaService';

const R2_API_BASE = 'https://www.mzoo.app/api/v1/storage/r2-storage';
const R2_PUBLIC_BASE = 'https://pub-1a94f502e4c04d268342cf995350b848.r2.dev';
const VIDEO_PATH_PREFIX = 'dev/morfeum/videos-loops';

interface R2UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Download a file from URL and return as base64
 */
async function downloadAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Upload a video from URL to R2 storage
 * 
 * @param sourceUrl - URL of the video to upload (e.g., replicate CDN)
 * @param mediaId - Media ID to use as filename
 * @param apiKey - MZOO API key
 * @returns Upload result with permanent R2 URL
 */
export async function uploadVideoToR2(
  sourceUrl: string,
  mediaId: string,
  apiKey: string
): Promise<R2UploadResult> {
  try {
    // Download video from source URL
    const base64Content = await downloadAsBase64(sourceUrl);
    
    // Build R2 storage key
    const filename = `${mediaId}.mp4`;
    const key = `${VIDEO_PATH_PREFIX}/${filename}`;
    
    // Upload to R2
    const response = await fetch(`${R2_API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename,
        content: base64Content,
        contentType: 'video/mp4',
        key
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `R2 upload failed: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    
    // Use public URL (r2.mzoo.app) instead of internal R2 URL from response
    const publicUrl = `${R2_PUBLIC_BASE}/${key}`;
    
    return {
      success: true,
      url: publicUrl,
      key: result.data?.key || key
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Background task: Upload video to R2 and update media entry
 * 
 * This runs fire-and-forget after the initial video URL is saved.
 * It downloads from replicate, uploads to R2, then updates media.json.
 * 
 * @param replicateUrl - Temporary replicate CDN URL
 * @param mediaId - Media ID to update
 * @param apiKey - MZOO API key
 */
export async function uploadVideoToR2Background(
  replicateUrl: string,
  mediaId: string,
  apiKey: string
): Promise<void> {
  console.log(`[R2 Storage] Starting background upload for media: ${mediaId}`);
  
  try {
    const result = await uploadVideoToR2(replicateUrl, mediaId, apiKey);
    
    if (result.success && result.url) {
      // Update media entry with permanent R2 URL
      mediaService.addUrlVariant(mediaId, 'video', result.url);
      console.log(`[R2 Storage] Successfully uploaded and updated media: ${mediaId}`);
      console.log(`[R2 Storage] R2 URL: ${result.url}`);
    } else {
      console.error(`[R2 Storage] Upload failed for media ${mediaId}:`, result.error);
    }
  } catch (error) {
    console.error(`[R2 Storage] Background upload error for media ${mediaId}:`, error);
  }
}
