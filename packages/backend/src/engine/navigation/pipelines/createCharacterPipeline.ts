/**
 * Character Creation Pipeline (from Navigation)
 * Handles CREATE_CHARACTER_REAL and CREATE_CHARACTER_UNREAL commands
 * 
 * Flow:
 * 1. Prompt Engineering - Transform user input + environment DNA into detailed description
 * 2. Seed Generation - Create character seed from engineered prompt
 * 3. Image Generation - Generate character image
 * 4. Visual Analysis - Analyze the generated image
 * 5. Profile Enrichment - Build deep character profile
 * 6. Save - Persist character with location reference
 */

import { AI_MODELS } from '../../../config/constants';
import * as mzooService from '../../../services/mzoo';
import type { NavigationDecision, NavigationContext } from '../types';
import type { CharacterType } from '../../generation/prompts/characters/characterPromptEngineering';
import { getCharacterPromptEngineer } from '../../generation/prompts/characters/characterPromptEngineering';
import {
  generateCharacterSeed,
  generateCharacterImage,
  analyzeCharacterImage,
  enrichCharacterProfile
} from '../../pipelines/characterPipeline';
import { saveAndPinEntity, buildCharacterEntity } from '../../pipelines/shared/entityPersistence';
import { PipelineHelper } from '../../pipelines/shared/pipelineHelpers';

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

    // Step 3: Image Generation
    helper.startStage('image_generation', 'Generating character image...');

    const { imageUrl, imagePrompt } = await generateCharacterImage(seed, apiKey);

    helper.completeStage('image_generation', 'Character image generated', { imageUrl });

    // Step 4: Visual Analysis
    helper.startStage('visual_analysis', 'Analyzing character appearance...');

    const visualAnalysis = await analyzeCharacterImage(imageUrl, seed, apiKey);

    helper.completeStage('visual_analysis', 'Character appearance analyzed');

    // Step 5: Profile Enrichment
    helper.startStage('profile_enrichment', 'Building character profile...');

    const deepProfile = await enrichCharacterProfile(seed, visualAnalysis, apiKey);

    helper.completeStage('profile_enrichment', 'Character profile complete');

    // Step 6: Save character with location reference
    const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const character = buildCharacterEntity(
      characterId,
      seed,
      visualAnalysis,
      deepProfile,
      imageUrl,
      imagePrompt
    );

    // Add location reference and character type (NOT embedding environment data)
    (character as any).sourceLocationId = locationId;
    (character as any).sourceLocationName = locationName;
    (character as any).characterType = characterType;

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
