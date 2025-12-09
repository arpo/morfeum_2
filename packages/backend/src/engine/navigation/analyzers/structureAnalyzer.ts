/**
 * Structure Analyzer
 * LLM-powered analysis of space structure for navigation commands
 * Determines physical/spatial properties of a new space
 */

import * as mzooService from '../../../services/mzoo.service';
import { AI_MODELS } from '../../../config';
import { structureAnalysisPrompt, extractRequiredElements } from '../../generation/prompts/navigation/structureAnalysis';
import type { NavigationContext, StructureAnalysis, Structure } from '../types';

/**
 * Analyze structure using LLM to determine physical/spatial properties
 * 
 * @param apiKey - MZOO API key
 * @param userPrompt - User's space description (e.g., "Parisian Café, cozy charm...")
 * @param context - Navigation context including current node and parent location
 * @param perspective - Whether this is an interior or exterior space
 * @returns StructureAnalysis with physical structure data
 */
export async function analyzeStructure(
  apiKey: string,
  userPrompt: string,
  context: NavigationContext,
  perspective: 'interior' | 'exterior',
  includeFurnishing?: boolean
): Promise<StructureAnalysis> {
  // Generate the analysis prompt
  const prompt = structureAnalysisPrompt({
    userPrompt,
    context,
    perspective,
    includeFurnishing
  });

  // Call LLM for structure analysis
  const response = await mzooService.generateText(
    apiKey,
    [{ role: 'user', content: prompt }],
    AI_MODELS.NAVIGATOR
  );

  // Handle errors
  if (response.error || !response.data) {
    console.error('[StructureAnalyzer] LLM call failed:', response.error);
    return createFallbackAnalysis(userPrompt, perspective, context);
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
    const result: StructureAnalysis = JSON.parse(cleaned);
    
    // Ensure requiredElements includes user-specified elements (fallback extraction)
    const extractedElements = extractRequiredElements(userPrompt);
    if (extractedElements.length > 0) {
      result.structure.requiredElements = [
        ...(result.structure.requiredElements || []),
        ...extractedElements
      ];
      // Remove duplicates
      result.structure.requiredElements = [...new Set(result.structure.requiredElements)];
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🏗️ STRUCTURE ANALYSIS RESULT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Name: ${result.name}`);
    console.log(`  Perspective: ${result.perspective}`);
    console.log(`  Form: ${result.structure.form}`);
    console.log(`  Scale: ${result.structure.scale}`);
    console.log(`  Functional Type: ${result.structure.functionalType}`);
    console.log(`  Required Elements: ${result.structure.requiredElements?.length || 0}`);
    console.log(`  Navigable Elements: ${result.structure.navigableElements?.length || 0}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return result;
  } catch (parseError) {
    console.error('[StructureAnalyzer] Failed to parse LLM response:', parseError);
    console.error('[StructureAnalyzer] Raw response:', cleaned);
    return createFallbackAnalysis(userPrompt, perspective, context);
  }
}

/**
 * Create a fallback analysis when LLM fails
 */
function createFallbackAnalysis(
  userPrompt: string,
  perspective: 'interior' | 'exterior',
  context: NavigationContext
): StructureAnalysis {
  // Extract name from user prompt
  const name = extractSimpleName(userPrompt);
  
  // Determine functional type from keywords
  const functionalType = detectFunctionalType(userPrompt);
  
  // Get parent structure for inheritance
  const parentDna = context.parentNode?.dna as any;
  const currentDna = context.currentNode.dna as any;
  const parentStructure = parentDna?.structure || currentDna?.structure;
  
  // Extract required elements from user input
  const requiredElements = extractRequiredElements(userPrompt);
  
  // Determine scale first so we can use it in spatialLayout
  const scale = parentStructure?.scale || 'medium';

  const structure: Structure = {
    form: parentStructure?.form || 'rectangular',
    roofType: perspective === 'exterior' ? 'open-sky' : (parentStructure?.roofType || 'flat'),
    scale,
    orientation: parentStructure?.orientation || 'cubic',
    openings: perspective === 'interior' ? 'minimal' : 'large-glass',
    functionalType,
    spatialLayout: `A ${scale} ${perspective} space.`,
    requiredElements: requiredElements.length > 0 ? requiredElements : undefined,
    suggestedFixtures: getSuggestedFixtures(functionalType),
    navigableElements: [
      { type: 'door', position: 'back', description: 'Main entrance' }
    ],
    dominantElements: [name],
    uniqueIdentifiers: requiredElements.length > 0 ? requiredElements.slice(0, 2) : [name]
  };

  return {
    name,
    perspective,
    structure,
    description: userPrompt
  };
}

/**
 * Extract a simple name from user prompt
 */
function extractSimpleName(userPrompt: string): string {
  // Try to extract "the X" or first significant phrase
  const theMatch = userPrompt.match(/^(?:the\s+)?([A-Za-z][A-Za-z\s]{2,20}?)(?:[,.]|$)/i);
  if (theMatch) {
    return theMatch[1].trim().split(' ').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
  }
  
  // Take first few words and capitalize
  const words = userPrompt.split(/[\s,.]/).slice(0, 3).filter(w => w.length > 0);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Detect functional type from keywords in prompt
 */
function detectFunctionalType(userPrompt: string): Structure['functionalType'] {
  const lower = userPrompt.toLowerCase();
  
  // Commercial
  if (/shop|store|market|mall|boutique|café|cafe|restaurant|bakery|pharmacy/.test(lower)) {
    return 'commercial';
  }
  
  // Entertainment
  if (/bar|club|pub|theater|theatre|cinema|lounge|arena|stadium/.test(lower)) {
    return 'entertainment';
  }
  
  // Religious
  if (/church|temple|mosque|synagogue|chapel|shrine|cathedral/.test(lower)) {
    return 'religious';
  }
  
  // Industrial
  if (/factory|warehouse|workshop|garage|plant|foundry|mill/.test(lower)) {
    return 'industrial';
  }
  
  // Civic
  if (/office|library|museum|gallery|school|hospital|station/.test(lower)) {
    return 'civic';
  }
  
  // Default to residential
  return 'residential';
}

/**
 * Get suggested fixtures based on functional type
 */
function getSuggestedFixtures(functionalType: Structure['functionalType']): string[] {
  switch (functionalType) {
    case 'commercial':
      return ['display shelves', 'sales counter', 'merchandise racks', 'signage'];
    case 'entertainment':
      return ['seating area', 'bar counter', 'stage or performance area', 'atmospheric lighting'];
    case 'religious':
      return ['altar', 'pews or prayer area', 'religious iconography', 'candles'];
    case 'industrial':
      return ['machinery', 'workstations', 'storage racks', 'control panels'];
    case 'civic':
      return ['desks', 'display cases', 'seating', 'information displays'];
    case 'residential':
    default:
      return ['furniture', 'storage', 'decorative elements', 'lighting'];
  }
}
