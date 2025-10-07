/**
 * Spawn Pipeline Stages
 * Individual stages of entity generation pipeline
 */

import * as mzooService from '../mzoo.service';
import { getPrompt } from '../../prompts';
import { EntitySeed, VisualAnalysis, DeepProfile } from './types';

/**
 * Generate entity seed from text prompt
 */
export async function generateSeed(
  mzooApiKey: string,
  textPrompt: string,
  signal: AbortSignal
): Promise<EntitySeed> {
  const systemPrompt = getPrompt('entitySeedGeneration', 'en')(textPrompt);
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: textPrompt }
  ];

  const result = await mzooService.generateText(
    mzooApiKey,
    messages,
    'gemini-2.5-flash-lite'
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
 * Generate entity image from seed
 */
export async function generateImage(
  mzooApiKey: string,
  seed: EntitySeed,
  signal: AbortSignal
): Promise<string> {
  const imagePrompt = getPrompt('entityImageGeneration', 'en')(
    seed.originalPrompt || '',
    seed.name,
    seed.looks,
    seed.wearing,
    seed.personality,
    seed.presence,
    seed.setting
  );

  const result = await mzooService.generateImage(
    mzooApiKey,
    imagePrompt,
    1,
    'landscape_16_9',
    'high'
  );

  if (result.error) {
    throw new Error(result.error);
  }

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Image URL not found in response');
  }

  return imageUrl;
}

/**
 * Analyze entity image
 */
export async function analyzeImage(
  mzooApiKey: string,
  imageUrl: string,
  seed: EntitySeed,
  signal: AbortSignal
): Promise<VisualAnalysis> {
  // Fetch image and convert to base64
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Get analysis prompt
  const analysisPrompt = getPrompt('visualAnalysis', 'en')(
    seed.name,
    seed.looks,
    seed.wearing,
    seed.personality,
    seed.presence
  );

  // Call vision API
  const result = await mzooService.analyzeImage(
    mzooApiKey,
    base64Image,
    analysisPrompt,
    'image/jpeg',
    'gemini-2.5-flash'
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
  seed: EntitySeed,
  visualAnalysis: VisualAnalysis,
  signal: AbortSignal
): Promise<DeepProfile> {
  const seedJson = JSON.stringify(seed, null, 2);
  const visionJson = JSON.stringify(visualAnalysis, null, 2);
  const originalPrompt = seed.originalPrompt || 'No specific request provided';

  const enrichmentPrompt = getPrompt('deepProfileEnrichment', 'en')(seedJson, visionJson, originalPrompt);

  const messages = [
    { role: 'system', content: enrichmentPrompt },
    { role: 'user', content: 'Generate the complete character profile based on the provided data.' }
  ];

  const result = await mzooService.generateText(
    mzooApiKey,
    messages,
    'gemini-2.5-flash'
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
