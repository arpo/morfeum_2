/**
 * Destination Analysis Step (STEP 0.5)
 * Runs LLM-based destination analysis for GOTO and rich GO_INSIDE commands
 */

import type { NavigationDecision, NavigationContext, DestinationAnalysis } from '../../types';
import { analyzeDestination } from '../../analyzers/destinationAnalyzer';
import { shouldRunDestinationAnalysis } from '../../navigationHelpers';
import { PipelineHelper } from '../../../pipelines/shared/pipelineHelpers';

export interface DestinationAnalysisInput {
  command: 'GOTO' | 'GO_INSIDE';
  userPrompt: string;
  context: NavigationContext;
  decision: NavigationDecision;
  apiKey: string;
  helper: PipelineHelper | null;
}

export interface DestinationAnalysisOutput {
  destinationAnalysis: DestinationAnalysis | null;
  updatedPerspective: string;
}

/**
 * Run destination analysis step
 * GOTO: Always runs destination analysis
 * GO_INSIDE: Runs conditionally for rich descriptions (>20 chars)
 */
export async function runDestinationAnalysisStep(
  input: DestinationAnalysisInput
): Promise<DestinationAnalysisOutput> {
  const { command, userPrompt, context, decision, apiKey, helper } = input;
  let destinationAnalysis: DestinationAnalysis | null = null;
  let updatedPerspective = decision.perspective || 'interior';

  if (command === 'GOTO') {
    // GOTO always runs destination analysis
    if (helper) {
      helper.startStage('destination_analysis', 'Analyzing destination...');
    }
    
    console.log(`\n🎯 [Pipeline] Running destination analysis for GOTO`);
    console.log(`  User prompt: "${userPrompt}"`);
    
    destinationAnalysis = await analyzeDestination(apiKey, userPrompt, context);
    
    // Update decision with analysis results
    if (destinationAnalysis) {
      decision.newNodeName = destinationAnalysis.name;
      decision.perspective = destinationAnalysis.perspective;
      updatedPerspective = destinationAnalysis.perspective;
      console.log(`  Result: name="${destinationAnalysis.name}", perspective="${destinationAnalysis.perspective}"`);
    }
    
    if (helper) {
      helper.completeStage('destination_analysis', 'Destination analyzed', {
        name: destinationAnalysis?.name,
        perspective: destinationAnalysis?.perspective
      });
    }
  } else if (command === 'GO_INSIDE' && shouldRunDestinationAnalysis(command, userPrompt)) {
    // GO_INSIDE: Update pipeline config to include destination_analysis step (dynamic config)
    if (helper) {
      helper.updatePipelineConfig('navigationWithDestination', 'Rich description detected...');
      helper.startStage('destination_analysis', 'Analyzing destination...');
    }
    
    console.log(`\n🎯 [Pipeline] Running conditional destination analysis for GO_INSIDE`);
    console.log(`  User prompt (${userPrompt.length} chars): "${userPrompt}"`);
    
    destinationAnalysis = await analyzeDestination(apiKey, userPrompt, context);
    
    // Update decision with analysis results
    if (destinationAnalysis) {
      decision.newNodeName = destinationAnalysis.name;
      decision.perspective = destinationAnalysis.perspective;
      updatedPerspective = destinationAnalysis.perspective;
      console.log(`  Result: name="${destinationAnalysis.name}", perspective="${destinationAnalysis.perspective}"`);
    }
    
    if (helper) {
      helper.completeStage('destination_analysis', 'Destination analyzed', {
        name: destinationAnalysis?.name,
        perspective: destinationAnalysis?.perspective
      });
    }
  }

  return { destinationAnalysis, updatedPerspective };
}
