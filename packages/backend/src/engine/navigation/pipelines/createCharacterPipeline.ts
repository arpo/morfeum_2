/**
 * Character Creation Pipeline (from Navigation)
 * Handles CREATE_CHARACTER_REAL and CREATE_CHARACTER_UNREAL commands
 * 
 * Flow:
 * 1. Prompt Engineering - Transform user input + environment DNA into detailed description
 * 2. Seed Generation - Create character seed from engineered prompt
 * 3. Scene Composition - LLM composes character + location into scene prompt
 * 4. Image Generation - Generate character in environment image
 * 5. Visual Analysis - Analyze the generated image
 * 6. Profile Enrichment - Build deep character profile
 * 7. Save - Persist character with location reference
 */

import { AI_MODELS } from '../../../config/constants';
import * as mzooService from '../../../services/mzoo';
import mediaService from '../../../services/media/mediaService';
import type { NavigationDecision, NavigationContext } from '../types';
import type { CharacterType } from '../../generation/prompts/characters/characterPromptEngineering';
import { getCharacterPromptEngineer } from '../../generation/prompts/characters/characterPromptEngineering';
import { 
  composeCharacterScenePrompt,
  getDefaultShotTypeForCharacterCreation 
} from '../../generation/prompts/characters/composeCharacterScenePrompt';
import {
  generateCharacterSeed,
  analyzeCharacterImage,
  enrichCharacterProfile
} from '../../pipelines/characterPipeline';
import { generateImage } from '../../pipelines/shared/imageGeneration';
import { applyMorfeumStyle } from '../../generation/shared/applyMorfeumStyle';
import { saveAndPinEntity, buildCharacterEntity } from '../../pipelines/shared/entityPersistence';
import { PipelineHelper } from '../../pipelines/shared/pipelineHelpers';

/**
 * Get the node's original image prompt from its primaryMedia
 */
function getNodeImagePrompt(context: NavigationContext): string | null {
  const currentNode = context.currentNode;
  
  // Try to get primaryMedia ID from the node (may be in data or at node level)
  const primaryMediaId = (currentNode as any).primaryMedia || (currentNode.data as any)?.primaryMedia;
  
  if (!primaryMediaId) {
    console.log('[CreateCharacterPipeline] No primaryMedia on node, falling back to environment DNA');
    return null;
  }
  
  // Fetch the media to get its prompt
  const media = mediaService.getMediaById(primaryMediaId);
  
  if (!media || !media.metadata?.prompt) {
    console.log('[CreateCharacterPipeline] Could not get image prompt from media, falling back');
    return null;
  }
  
  return media.metadata.prompt;
}

/**
 * Run the character creation pipeline from a navigation command
 */
export async function runCreateCharacterPipeline(
  decision: NavigationDecision,
  context: NavigationContext,
  apiKey: string,
  navigationId: string
): Promise<void> {
  const metadata = decision.metadata || {};
  const characterType = metadata.characterType as CharacterType || 'real';
  const environmentDNA = metadata.environmentDNA as string || '';
  const userPrompt = metadata.userPrompt as string || '';
  const locationId = metadata.locationId as string || context.currentNode.id;
  const locationName = metadata.locationName as string || context.currentNode.name;

  // Use PipelineHelper for proper SSE event handling
  const helper = new PipelineHelper(navigationId, 'CharacterPipeline', 'characterNavigation');

  try {
    helper.started(`Creating ${characterType} character...`);

    // Step 1: Prompt Engineering
    // Transform user input + environment DNA into a detailed character description
    helper.startStage('prompt_engineering', `Crafting ${characterType} character description...`);

    const promptEngineer = getCharacterPromptEngineer(characterType);
    const engineeringPrompt = promptEngineer(userPrompt, environmentDNA);
    
    const engineeringResult = await mzooService.generateText(
      apiKey,
      [
        { role: 'system', content: engineeringPrompt },
        { role: 'user', content: userPrompt || 'Create a character that fits this environment.' }
      ],
      AI_MODELS.SEED_GENERATION
    );

    if (engineeringResult.error || !engineeringResult.data?.text) {
      throw new Error(engineeringResult.error || 'Failed to generate character description');
    }

    const engineeredDescription = engineeringResult.data.text;

    helper.completeStage('prompt_engineering', 'Character description crafted', {
      description: engineeredDescription.substring(0, 200) + '...'
    });

    // Step 2: Seed Generation
    helper.startStage('seed_generation', 'Creating character seed...');

    const seed = await generateCharacterSeed(engineeredDescription, apiKey);

    helper.completeStage('seed_generation', 'Character seed created', { name: seed.name });

    // Step 3: Scene Composition
    // LLM combines character seed with location context (image prompt or environment DNA)
    helper.startStage('scene_composition', 'Composing scene...');

    // Get the node's original image prompt (the prompt that generated its image)
    const locationImagePrompt = getNodeImagePrompt(context);
    
    // Use either the actual image prompt OR the environment DNA
    // Both go through the LLM scene composer for intelligent integration
    const locationContext = locationImagePrompt || environmentDNA || 'A natural outdoor environment';
    
    console.log(`[CreateCharacterPipeline] Using ${locationImagePrompt ? 'image prompt' : 'environment DNA'} for scene composition`);
    
    // Use half_portrait for initial character creation (character identity image)
    const shotType = getDefaultShotTypeForCharacterCreation(); // 'half_portrait'
    
    // ALWAYS use LLM scene composer - no fallback concatenation
    const scenePrompt = await composeCharacterScenePrompt(
      {
        name: seed.name,
        looks: seed.looks,
        wearing: seed.wearing || '',
        presence: seed.presence,
        personality: seed.personality
      },
      locationContext,
      shotType,
      apiKey
      // No action for initial character creation - natural pose
    );
    
    console.log('[CreateCharacterPipeline] LLM composed scene prompt');

    helper.completeStage('scene_composition', 'Scene composed', {
      promptLength: scenePrompt.length
    });

    // Step 4: Image Generation
    // Generate character in environment (NOT portrait style)
    helper.startStage('image_generation', 'Generating character image...');

    // Apply Morfeum style WITHOUT NoCreatures filter (characters need people!)
    const finalPrompt = applyMorfeumStyle(scenePrompt, { excludeCreatures: false });
    
    console.log('\n==================== CHARACTER SCENE PROMPT ====================');
    console.log(finalPrompt);
    console.log('==================== END SCENE PROMPT ====================\n');

    const { imageUrl } = await generateImage(apiKey, finalPrompt, 1, 'landscape_16_9', 'none');

    helper.completeStage('image_generation', 'Character image generated', { imageUrl });

    // Step 5: Visual Analysis
    helper.startStage('visual_analysis', 'Analyzing character appearance...');

    const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey);

    helper.completeStage('visual_analysis', 'Character appearance analyzed');

    // Step 6: Profile Enrichment
    helper.startStage('profile_enrichment', 'Building character profile...');

    const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey);

    helper.completeStage('profile_enrichment', 'Character profile complete');

    // Step 7: Save character with location reference
    const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const character = buildCharacterEntity(
      characterId,
      seed,
      visualAnalysis,
      deepProfile,
      imageUrl,
      finalPrompt // Store the scene prompt, not the old portrait prompt
    );

    // Add location reference, character type, and original context/backstory
    (character as any).sourceLocationId = locationId;
    (character as any).sourceLocationName = locationName;
    (character as any).characterType = characterType;
    (character as any).context = userPrompt; // Store original user prompt as backstory

    await saveAndPinEntity('character', character);

    // Send completion event with character data
    helper.completed('Character created successfully', {
      character: {
        id: character.id,
        name: character.name,
        imageUrl: character.imageUrl,
        characterType,
        sourceLocationId: locationId,
        sourceLocationName: locationName
      }
    });

  } catch (error) {
    console.error('[CreateCharacterPipeline] Error:', error);
    helper.error(error instanceof Error ? error : new Error('Failed to create character'));
  }
}
