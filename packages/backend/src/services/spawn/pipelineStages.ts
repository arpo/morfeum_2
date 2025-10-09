/**
 * Spawn Pipeline Stages
 * Individual stages of entity generation pipeline
 */

import * as mzooService from '../mzoo.service';
import { getPrompt } from '../../prompts';
import { AI_MODELS } from '../../config/constants';
import { EntitySeed, VisualAnalysis, LocationVisualAnalysis, DeepProfile, LocationSeed, LocationDeepProfile } from './types';

/**
 * Generate entity seed from text prompt
 */
export async function generateSeed(
  mzooApiKey: string,
  textPrompt: string,
  signal: AbortSignal,
  entityType: 'character' | 'location' = 'character',
  movementContext?: any
): Promise<EntitySeed | LocationSeed> {
  const promptKey = entityType === 'location' ? 'locationSeedGeneration' : 'characterSeedGeneration';
  
  // Build the system prompt with movement context if available
  let systemPrompt = getPrompt(promptKey, 'en')(textPrompt);
  
  // For locations with movement context, append world/location info
  if (entityType === 'location' && movementContext) {
    console.log('[generateSeed] Using movement context:', {
      movementType: movementContext.movementType,
      hasWorldInfo: !!movementContext.worldInfo,
      hasLocationInfo: !!movementContext.locationInfo
    });
    
    let contextAddition = '\n\n=== MOVEMENT CONTEXT ===\n';
    contextAddition += `Movement Type: ${movementContext.movementType}\n`;
    contextAddition += `Current Location: ${movementContext.currentLocationName}\n`;
    
    if (movementContext.worldInfo) {
      contextAddition += '\n--- World DNA (maintain these characteristics) ---\n';
      contextAddition += JSON.stringify(movementContext.worldInfo, null, 2);
    }
    
    if (movementContext.locationInfo) {
      contextAddition += '\n\n--- Current Location Context ---\n';
      contextAddition += JSON.stringify(movementContext.locationInfo, null, 2);
    }
    
    systemPrompt += contextAddition;
    console.log('[generateSeed] Enhanced prompt length:', systemPrompt.length);
  }
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: textPrompt }
  ];

  const result = await mzooService.generateText(
    mzooApiKey,
    messages,
    AI_MODELS.SEED_GENERATION
  );

  if (result.error) {
    throw new Error(result.error);
  }

  // Parse JSON response
  const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const seed = JSON.parse(jsonMatch[0]);
  // console.log('Generated seed:', JSON.stringify(seed, null, 2));
  
  return seed;
}

/**
 * Generate entity image from seed
 */
export async function generateImage(
  mzooApiKey: string,
  seed: EntitySeed | LocationSeed,
  signal: AbortSignal,
  entityType: 'character' | 'location' = 'character'
): Promise<{ imageUrl: string; imagePrompt: string }> {
  let imagePrompt: string;

  if (entityType === 'location') {
    const locationSeed = seed as LocationSeed;
    imagePrompt = getPrompt('locationImageGeneration', 'en')(
      locationSeed.originalPrompt || '',
      locationSeed.name,
      locationSeed.looks,
      locationSeed.atmosphere,
      locationSeed.mood,
      'Cinematic Establishing Shot'
    );
  } else {
    const entitySeed = seed as EntitySeed;
    imagePrompt = getPrompt('characterImageGeneration', 'en')(
      entitySeed.originalPrompt || '',
      entitySeed.name,
      entitySeed.looks,
      entitySeed.wearing,
      entitySeed.personality,
      entitySeed.presence,
      entitySeed.setting
    );
  }

  const result = await mzooService.generateImage(
    mzooApiKey,
    imagePrompt,
    1,
    'landscape_16_9',
    'none'
  );

  if (result.error) {
    throw new Error(result.error);
  }

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Image URL not found in response');
  }

  return { imageUrl, imagePrompt };
}

/**
 * Analyze entity image
 */
export async function analyzeImage(
  mzooApiKey: string,
  imageUrl: string,
  seed: EntitySeed | LocationSeed,
  signal: AbortSignal,
  entityType: 'character' | 'location' = 'character'
): Promise<VisualAnalysis | LocationVisualAnalysis> {
  // Fetch image and convert to base64
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  let analysisPrompt: string;

  if (entityType === 'location') {
    const locationSeed = seed as LocationSeed;
    analysisPrompt = getPrompt('locationVisualAnalysis', 'en')(
      locationSeed.name,
      locationSeed.looks,
      locationSeed.atmosphere,
      locationSeed.mood
    );
  } else {
    const entitySeed = seed as EntitySeed;
    analysisPrompt = getPrompt('characterVisualAnalysis', 'en')(
      entitySeed.name,
      entitySeed.looks,
      entitySeed.wearing,
      entitySeed.personality,
      entitySeed.presence
    );
  }

  // Call vision API
  const result = await mzooService.analyzeImage(
    mzooApiKey,
    base64Image,
    analysisPrompt,
    'image/jpeg',
    AI_MODELS.VISUAL_ANALYSIS
  );

  if (result.error) {
    throw new Error(result.error);
  }

  // Parse JSON response
  const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Enrich profile with deep details
 */
export async function enrichProfile(
  mzooApiKey: string,
  seed: EntitySeed | LocationSeed,
  visualAnalysis: VisualAnalysis | LocationVisualAnalysis,
  signal: AbortSignal,
  entityType: 'character' | 'location' = 'character'
): Promise<DeepProfile | LocationDeepProfile> {
  const seedJson = JSON.stringify(seed, null, 2);
  const visionJson = JSON.stringify(visualAnalysis, null, 2);
  const originalPrompt = seed.originalPrompt || 'No specific request provided';

  const promptKey = entityType === 'location' ? 'locationDeepProfileEnrichment' : 'characterDeepProfileEnrichment';
  const enrichmentPrompt = getPrompt(promptKey, 'en')(seedJson, visionJson, originalPrompt);

  const userMessage = entityType === 'location' 
    ? 'Generate the complete location profile based on the provided data.'
    : 'Generate the complete character profile based on the provided data.';

  const messages = [
    { role: 'system', content: enrichmentPrompt },
    { role: 'user', content: userMessage }
  ];

  const result = await mzooService.generateText(
    mzooApiKey,
    messages,
    AI_MODELS.PROFILE_ENRICHMENT
  );

  if (result.error) {
    throw new Error(result.error);
  }

  // Parse JSON response
  const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}
