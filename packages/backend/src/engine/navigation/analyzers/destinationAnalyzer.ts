/**
 * Destination Analyzer
 * LLM-powered analysis of GOTO command destinations
 * Synthesizes user's destination prompt with parent location context
 */

import * as mzooService from '../../../services/mzoo.service';
import { AI_MODELS } from '../../../config';
import { destinationAnalysisPrompt } from '../../generation/prompts/navigation';
import type { NavigationContext, DestinationAnalysis } from '../types';

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

  // Call LLM for destination analysis
  const response = await mzooService.generateText(
    apiKey,
    [{ role: 'user', content: prompt }],
    AI_MODELS.NAVIGATOR
  );

  // Handle errors
  if (response.error || !response.data) {
    console.error('[DestinationAnalyzer] LLM call failed:', response.error);
    // Return fallback with user's input as-is
    return createFallbackAnalysis(userPrompt);
  }

  // Extract text from response
  const text = typeof response.data === 'string' 
    ? response.data 
    : (response.data.text || JSON.stringify(response.data));

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
 */
function createFallbackAnalysis(userPrompt: string): DestinationAnalysis {
  // Simple heuristic for perspective detection as fallback
  const lowerPrompt = userPrompt.toLowerCase();
  const exteriorWords = ['balcony', 'terrace', 'garden', 'patio', 'courtyard', 'rooftop', 'porch', 'veranda', 'deck', 'yard', 'outside', 'exterior', 'outdoor'];
  const isExterior = exteriorWords.some(word => lowerPrompt.includes(word));
  
  // Extract a simple name from the prompt
  const name = extractSimpleName(userPrompt);
  
  return {
    name,
    perspective: isExterior ? 'exterior' : 'interior',
    spaceType: isExterior ? 'outdoor' : 'room',
    isEnclosed: !isExterior,
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
