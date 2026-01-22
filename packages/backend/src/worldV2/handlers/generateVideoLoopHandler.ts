/**
 * Generate Video Loop Handler
 * 
 * Creates a seamless video loop from the current image using scene context.
 * 
 * Flow:
 * 1. Get node and media data
 * 2. Build video prompt using LLM based on scene context (weather, atmosphere, etc.)
 * 3. Call video generation API with prompt + image
 * 4. Save video URL to media entry
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import { generateVideo, generateText } from '../../services/mzoo';
import { DEFAULT_VIDEO_SETTINGS } from '../../services/mzoo/config/endpoints';
import { storageService } from '../../services/storage/storageService';
import mediaService from '../../services/media/mediaService';
import { PipelineHelper } from '../../engine/pipelines/shared/pipelineHelpers';
import {
  generateOperationId,
  setupPipeline,
  cleanupPipeline
} from '../utils/routeUtils';
import multer from 'multer';
import { uploadVideoToR2Background } from '../../services/r2Storage';

/**
 * Find host node by walking up the tree from any node
 */
function findHostForNode(worldsData: any, nodeId: string): any | null {
  const node = worldsData.nodes[nodeId];
  if (!node) return null;
  if (node.type === 'host') return node;

  if (node.type === 'view' && node.parentId) {
    return findHostForNode(worldsData, node.parentId);
  }

  for (const hostTree of worldsData.worldTrees) {
    if (findNodeInTree(hostTree, nodeId)) {
      return worldsData.nodes[hostTree.id];
    }
  }
  return null;
}

function findNodeInTree(tree: any, nodeId: string): boolean {
  if (tree.id === nodeId) return true;
  if (tree.children) {
    for (const child of tree.children) {
      if (findNodeInTree(child, nodeId)) return true;
    }
  }
  return false;
}

/**
 * Character video prompt (fixed, not LLM-generated)
 */
const CHARACTER_VIDEO_PROMPT = `A silent character, waiting in place. Calm, focused presence.
No speech. No lip, mouth, or vocal movement of any kind.

Preserve the character exactly as given.
Do not add eyes, facial features, limbs, details, symbols, creatures, particles, or any elements that do not already exist on the character.

The character performs natural, cinematic acting using the body it already has:
subtle head tilts and slow head turns, gentle shifts of the upper body, small arm or appendage movements, relaxed posture adjustments, slight weight transfers.
Motion feels organic, expressive, and intentional — never rigid, robotic, or frozen.

The character’s attention remains directed toward the camera at all times.
Head movement is allowed, but focus and engagement stay with the viewer.
The character may tilt or angle the head slightly, but does not look away or disengage.

If the character has hair or loose elements, a light wind softly moves hair strands and clothing.

Awareness and attention are conveyed through controlled movement and presence, not through added features.

The performance feels like a quiet movie moment where the character is present and waiting, aware of being watched.

Environment remains unchanged.
Camera completely still. Fixed tripod shot.
Mid or close framing.
Cinematic seamless loop with no visible start or end.`;

/**
 * Build the LLM prompt to generate a video loop description for locations
 */
function buildVideoPromptSystemPrompt(): string {
  return `You are a video prompt specialist. Your task is to create brief, effective prompts for generating seamless video loops from static images.

RULES:
1. Camera MUST remain FIXED (no camera movement)
2. Focus on subtle, natural ambient motion that can loop seamlessly
3. Keep prompts concise (1-2 sentences max)
4. Describe ONLY the motion, not the static scene

MOTION TYPES BY ELEMENT:
- Water: gentle ripples, waves rolling, reflections shimmering
- Sky/clouds: slow drift, subtle color shifts at sunset/sunrise
- Foliage: leaves rustling, branches swaying gently in breeze
- Fire/flames: flickering flames, dancing firelight
- Rain: drops falling, splashing in puddles, streaking down surfaces
- Snow: flakes drifting down slowly
- Fog/mist: swirling gently, drifting across scene
- Light: rays shifting, shadows moving slightly, light filtering through
- Fabric/curtains: gentle billowing, fabric rippling
- Particles: dust motes floating, embers drifting

OUTPUT FORMAT:
Provide ONLY the video prompt, no explanations or preambles.`;
}

function buildVideoPromptUserPrompt(context: {
  nodeName: string;
  nodeDescription?: string;
  timeOfDay?: string;
  weather?: string;
  atmosphere?: string;
  environment?: string;
  imagePrompt?: string;
}): string {
  const parts = [`Scene: ${context.nodeName}`];
  
  if (context.nodeDescription) parts.push(`Description: ${context.nodeDescription}`);
  if (context.environment) parts.push(`Environment: ${context.environment}`);
  if (context.timeOfDay) parts.push(`Time: ${context.timeOfDay.replace(/_/g, ' ')}`);
  if (context.weather) parts.push(`Weather: ${context.weather}`);
  if (context.atmosphere) parts.push(`Atmosphere: ${context.atmosphere}`);
  if (context.imagePrompt) parts.push(`Image prompt: ${context.imagePrompt}`);
  
  parts.push('\nCreate a brief video loop prompt describing subtle ambient motion for this scene.');
  
  return parts.join('\n');
}

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to handle both JSON and multipart/form-data
export const generateVideoLoopMiddleware = upload.single('filteredImage');

export const generateVideoLoopHandler = asyncHandler(async (req: Request, res: Response) => {
  // Support both JSON and multipart/form-data
  const nodeId = req.body.nodeId as string;
  const primaryMediaId = req.body.primaryMediaId as string;

  if (!nodeId || !primaryMediaId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: nodeId, primaryMediaId'
    });
    return;
  }

  const apiKey = (req as any).mzooApiKey;
  if (!apiKey) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Missing API key'
    });
    return;
  }

  const operationId = generateOperationId('videoloop');
  const eventsUrl = setupPipeline(operationId, 'v2Edit'); // Use simple pipeline type

  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command: 'GENERATE_VIDEO_LOOP'
    }
  });

  (async () => {
    const pipeline = new PipelineHelper(operationId, 'GENERATE_VIDEO_LOOP', 'v2Edit'); // Use simple pipeline type
    
    try {
      pipeline.started('Starting video loop generation...');

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 1: Analyze scene context
      // ═══════════════════════════════════════════════════════════════════════
      pipeline.startStage('analyzing', 'Analyzing scene context...');

      // Check media first (needed for both characters and locations)
      const media = mediaService.getMediaById(primaryMediaId);
      if (!media || !media.url) {
        throw new Error('Media not found or has no URL');
      }

      // Always use original media URL for video generation
      // (MZOO API doesn't support base64 data URLs, only HTTP URLs)
      const imageUrlToUse = media.url;

      // Check if this is a character (ID starts with 'char-')
      const isCharacter = nodeId.startsWith('char-');

      let enhancedPrompt: string;

      if (isCharacter) {
        // ═══════════════════════════════════════════════════════════════════════
        // CHARACTER PATH: Use fixed prompt, skip world node lookup
        // ═══════════════════════════════════════════════════════════════════════
        pipeline.completeStage('analyzing', 'Character detected');
        pipeline.startStage('prompting', 'Building video prompt...');
        
        enhancedPrompt = CHARACTER_VIDEO_PROMPT;
        pipeline.completeStage('prompting', 'Using character video prompt');
      } else {
        // ═══════════════════════════════════════════════════════════════════════
        // LOCATION PATH: Load world data and generate prompt via LLM
        // ═══════════════════════════════════════════════════════════════════════
        const worldsData = await storageService.loadWorlds();
        if (!worldsData || !worldsData.nodes) {
          throw new Error('No worlds data found in storage');
        }

        const node = worldsData.nodes[nodeId];
        if (!node) {
          throw new Error(`Node not found: ${nodeId}`);
        }

        // Get host for time/weather
        const host = findHostForNode(worldsData, nodeId);
        
        // Extract context from node DNA
        const nodeDNA = node.dna || {};
        const semantic = nodeDNA.semantic || {};

        const context = {
          nodeName: node.name,
          nodeDescription: node.description,
          timeOfDay: host?.timeOfDay,
          weather: host?.weather,
          atmosphere: semantic.atmosphere,
          environment: semantic.environment,
          imagePrompt: media.metadata?.prompt
        };

        pipeline.completeStage('analyzing', 'Scene context analyzed');

        // Generate video prompt via LLM
        pipeline.startStage('prompting', 'Building video prompt...');
        
        // Generate location-specific prompt using LLM
        const systemPrompt = buildVideoPromptSystemPrompt();
        const userPrompt = buildVideoPromptUserPrompt(context);

        const textResult = await generateText(
          apiKey,
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          'gemini-2.5-flash'
        );

        if (textResult.error || !textResult.data?.text) {
          throw new Error(textResult.error || 'Failed to generate video prompt');
        }

        const videoPrompt = textResult.data.text.trim();
        
        // Enhance prompt with fixed camera instructions from config
        enhancedPrompt = `${videoPrompt}. ${DEFAULT_VIDEO_SETTINGS.PROMPT_SUFFIX}`;
        
        pipeline.completeStage('prompting', `Prompt: ${videoPrompt.slice(0, 50)}...`);
      } // End of location path

      // ═══════════════════════════════════════════════════════════════════════
      // Stage 3: Generate video (22-35 seconds)
      // ═══════════════════════════════════════════════════════════════════════
      pipeline.startStage('generating', 'Generating video loop (this may take 30+ seconds)...');

      const videoResult = await generateVideo(apiKey, enhancedPrompt, {
        inputImage: imageUrlToUse,
        cameraFixed: DEFAULT_VIDEO_SETTINGS.CAMERA_FIXED,
        negativePrompt: DEFAULT_VIDEO_SETTINGS.NEGATIVE_PROMPT,
        duration: DEFAULT_VIDEO_SETTINGS.DURATION,
        aspectRatio: DEFAULT_VIDEO_SETTINGS.ASPECT_RATIO,
        resolution: DEFAULT_VIDEO_SETTINGS.RESOLUTION
      });

      if (videoResult.error || !videoResult.data?.videoURL) {
        throw new Error(videoResult.error || 'Failed to generate video');
      }

      const videoUrl = videoResult.data.videoURL;

      // Save video URL and prompt to media entry (replicate URL first for immediate display)
      mediaService.addUrlVariant(primaryMediaId, 'video', videoUrl);
      mediaService.updateMedia(primaryMediaId, {
        metadata: { videoPrompt: enhancedPrompt }
      });
      
      pipeline.completeStage('generating', 'Video generated');

      // Start background task to upload video to R2 for permanent storage
      // This runs fire-and-forget - client gets response immediately with replicate URL
      // When R2 upload completes, media.urls.video is updated to R2 URL
      uploadVideoToR2Background(videoUrl, primaryMediaId, apiKey).catch(err => {
        console.error('[VideoLoop] R2 background upload failed:', err);
      });

      // Send completion
      pipeline.completed('Video loop generated successfully', {
        nodeId,
        primaryMediaId,
        videoUrl,
        videoPrompt: enhancedPrompt
      });

    } catch (error) {
      pipeline.error(error instanceof Error ? error : new Error(String(error)));
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
