/**
 * Character Creation Handler
 * Handles CREATE_CHARACTER_REAL and CREATE_CHARACTER_UNREAL commands
 */

import { Response } from 'express';
import type { NavigationContext, NavigationAnalysisResult } from '../../../engine/navigation/types';
import { runCreateCharacterPipeline } from '../../../engine/navigation/pipelines/createCharacterPipeline';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs } from '../navigation';

/**
 * Handle create_character action (CREATE_CHARACTER_REAL / CREATE_CHARACTER_UNREAL)
 */
export async function handleCreateCharacter(
  res: Response,
  result: NavigationAnalysisResult,
  decision: any,
  context: NavigationContext,
  apiKey: string
): Promise<void> {
  const navigationId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
  
  console.log(`\n🎭 [NAVIGATION] Starting create_character pipeline...`);
  console.log(`[NAVIGATION] Navigation ID: ${navigationId}`);
  console.log(`[NAVIGATION] Character Type: ${decision.metadata?.characterType}`);
  console.log(`[NAVIGATION] Location: ${decision.metadata?.locationName}`);
  
  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline('characterNavigation');
  pipelineConfigs.set(navigationId, {
    pipelineType: 'characterNavigation',
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });
  
  // Return response immediately
  res.status(200).json({
    data: {
      ...result,
      navigationId,
      eventsUrl
    }
  });

  // Run character pipeline asynchronously
  (async () => {
    try {
      await runCreateCharacterPipeline(decision, context, apiKey, navigationId);
      console.log('✅ [NAVIGATION] Character pipeline complete');
    } catch (pipelineError) {
      console.error('\n❌ [NAVIGATION CHARACTER ERROR]', pipelineError);
    } finally {
      pipelineConfigs.delete(navigationId);
    }
  })();
}
