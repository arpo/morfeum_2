/**
 * Destination Analyzer
 * LLM-powered analysis of GOTO command destinations
 * Synthesizes user's destination prompt with parent location context
 * 
 * Uses Gemini Explicit Caching for 90% cost reduction on static prompt content.
 */

import { generateCachedText, generateText } from '../../../services/mzoo';
import { destinationAnalysisPrompt, destinationAnalysisDynamic } from '../../generation/prompts/navigation';
import type { NavigationContext, DestinationAnalysis, ScenePerspective } from '../types';

/**
 * Analyze a destination using LLM to synthesize user prompt with location context
 * 
 * @param apiKey - MZOO API key
 * @param userPrompt - User's destination description (e.g., "the kitchen with a large window")
 * @param context - Navigation context including current niche and parent location
 * @returns DestinationAnalysis with synthesized information
 */
export async function analyzeDestination(
  apiKey: string,
  userPrompt: string,
  context: NavigationContext
): Promise<DestinationAnalysis> {
  // Generate the analysis prompt
  const prompt = destinationAnalysisPrompt({
    userPrompt,
    context
  });

  // Build dynamic prompt for cached generation
  const dynamicPrompt = destinationAnalysisDynamic({
    userPrompt,
    context
  });

  // Use cached generation for destination analysis
  let responseText: string;
  try {
    const cachedResult = await generateCachedText(
      apiKey,
      'morfeum-navigation',
      dynamicPrompt
    );
    
    console.log(`[DestinationAnalyzer] Cached generation: cacheHit=${cachedResult.cacheHit}, cachedTokens=${cachedResult.usage?.cachedTokens || 0}`);
    responseText = cachedResult.text;
  } catch (cacheError) {
    console.warn('[DestinationAnalyzer] Cached generation failed, using fallback:', cacheError);
    // Fallback to non-cached generation using full prompt
    const response = await generateText(
      apiKey,
      [{ role: 'user', content: prompt }],
      'gemini-2.0-flash'
    );
    
    if (response.error || !response.data) {
      console.error('[DestinationAnalyzer] LLM call failed:', response.error);
      return createFallbackAnalysis(userPrompt);
    }
    
    responseText = typeof response.data === 'string' 
      ? response.data 
      : (response.data.text || JSON.stringify(response.data));
  }

  // Handle empty response
  if (!responseText) {
    console.error('[DestinationAnalyzer] Empty response from LLM');
    return createFallbackAnalysis(userPrompt);
  }

  const text = responseText;

  // Clean up response (remove markdown code fences if present)
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  // Parse JSON
  try {
    const result: DestinationAnalysis = JSON.parse(cleaned);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 DESTINATION ANALYSIS RESULT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Name:', result.name);
    console.log('  Perspective:', result.perspective);
    console.log('  Space Type:', result.spaceType);
    console.log('  Enclosed:', result.isEnclosed);
    console.log('  Atmosphere:', result.atmosphereHint);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return result;
  } catch (parseError) {
    console.error('[DestinationAnalyzer] Failed to parse LLM response:', parseError);
    console.error('[DestinationAnalyzer] Raw response:', cleaned);
    return createFallbackAnalysis(userPrompt);
  }
}

/**
 * Create a fallback analysis when LLM fails
 * Note: No string matching - defaults to 'interior' as the safest fallback
 * The LLM should determine the actual perspective in normal operation
 */
function createFallbackAnalysis(userPrompt: string): DestinationAnalysis {
  // Extract a simple name from the prompt
  const name = extractSimpleName(userPrompt);
  
  // Default to interior as the safest fallback when LLM fails
  // The structure analyzer will make the final determination
  return {
    name,
    perspective: 'interior',
    spaceType: 'room',
    isEnclosed: true,
    atmosphereHint: 'ambient atmosphere',
    synthesizedDescription: userPrompt
  };
}

/**
 * Extract a simple name from user prompt
 */
function extractSimpleName(userPrompt: string): string {
  // Try to extract "the X" or just capitalize first word
  const theMatch = userPrompt.match(/^the\s+(\w+)/i);
  if (theMatch) {
    return `The ${theMatch[1].charAt(0).toUpperCase()}${theMatch[1].slice(1)}`;
  }
  
  // Take first few words
  const words = userPrompt.split(' ').slice(0, 3);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
