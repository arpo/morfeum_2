/**
 * Structure Analyzer
 * LLM-powered analysis of space structure for navigation commands
 * Determines physical/spatial properties of a new space
 * 
 * NOTE: navigableElements and furnishing are NO LONGER generated here.
 * They are now user-controlled via the prompt enhancer feature.
 */

import * as mzooService from '../../../services/mzoo.service';
import { AI_MODELS } from '../../../config';
import { structureAnalysisPrompt, extractRequiredElements } from '../../generation/prompts/navigation/structureAnalysis';
import type { NavigationContext, StructureAnalysis, Structure, NavigableElement, ScenePerspective } from '../types';

/** Parsed enhancements from user command */
export interface ParsedEnhancements {
  navigableElements?: NavigableElement[];
  furnishing?: string[];
}

/**
 * Analyze structure using LLM to determine physical/spatial properties
 * 
 * @param apiKey - MZOO API key
 * @param userPrompt - User's space description (e.g., "Parisian Café, cozy charm...")
 * @param context - Navigation context including current node and parent location
 * @param perspective - Optional perspective override. If null/undefined, LLM determines it.
 * @param parsedEnhancements - Optional pre-parsed navigable elements and furnishing from command
 * @returns StructureAnalysis with physical structure data (includes LLM-determined perspective)
 */
export async function analyzeStructure(
  apiKey: string,
  userPrompt: string,
  context: NavigationContext,
  perspective?: ScenePerspective | null,
  parsedEnhancements?: ParsedEnhancements
): Promise<StructureAnalysis> {
  // Generate the analysis prompt
  const prompt = structureAnalysisPrompt({
    userPrompt,
    context,
    perspective
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
    // Fallback to interior if no perspective provided
    return createFallbackAnalysis(userPrompt, perspective || 'interior', context, parsedEnhancements);
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
    
    // CRITICAL: If user explicitly specified perspective (--exterior, --interior, --open-air),
    // FORCE that perspective regardless of what LLM returned
    if (perspective) {
      const userExplicitlySpecified = perspective !== result.perspective;
      if (userExplicitlySpecified) {
        console.log(`[StructureAnalyzer] Overriding LLM perspective '${result.perspective}' with user-specified '${perspective}'`);
        result.perspective = perspective;
        
        // For exterior/open-air, ensure roofType is 'open-sky'
        if (perspective === 'exterior' || perspective === 'open-air') {
          result.structure.roofType = 'open-sky';
          console.log(`[StructureAnalyzer] Setting roofType to 'open-sky' for ${perspective} space`);
        }
      }
    }
    
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
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Apply parsed enhancements from command (user-controlled)
    if (parsedEnhancements?.navigableElements && parsedEnhancements.navigableElements.length > 0) {
      result.structure.navigableElements = parsedEnhancements.navigableElements;
      console.log(`  [Enhanced] Navigable Elements: ${parsedEnhancements.navigableElements.length}`);
    }
    
    if (parsedEnhancements?.furnishing && parsedEnhancements.furnishing.length > 0) {
      result.furnishingDetails = {
        userSpecified: parsedEnhancements.furnishing,
        suggested: [],
        placementNotes: []
      };
      console.log(`  [Enhanced] Furnishing Items: ${parsedEnhancements.furnishing.length}`);
    }
    
    return result;
  } catch (parseError) {
    console.error('[StructureAnalyzer] Failed to parse LLM response:', parseError);
    console.error('[StructureAnalyzer] Raw response:', cleaned);
    // Fallback to interior if no perspective provided
    return createFallbackAnalysis(userPrompt, perspective || 'interior', context, parsedEnhancements);
  }
}

/**
 * Create a fallback analysis when LLM fails
 */
function createFallbackAnalysis(
  userPrompt: string,
  perspective: ScenePerspective,
  context: NavigationContext,
  parsedEnhancements?: ParsedEnhancements
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

  // NOTE: navigableElements and suggestedFixtures are NO LONGER auto-generated
  // They come from user input via the prompt enhancer feature
  // For exterior and open-air, use open-sky roofType
  const isOpenSky = perspective === 'exterior' || perspective === 'open-air';
  const structure: Structure = {
    form: parentStructure?.form || 'rectangular',
    roofType: isOpenSky ? 'open-sky' : (parentStructure?.roofType || 'flat'),
    scale,
    orientation: parentStructure?.orientation || 'cubic',
    openings: perspective === 'interior' ? 'minimal' : (perspective === 'open-air' ? 'open-passages' : 'large-glass'),
    functionalType,
    spatialLayout: `A ${scale} ${perspective} space.`,
    requiredElements: requiredElements.length > 0 ? requiredElements : undefined,
    dominantElements: [name],
    uniqueIdentifiers: requiredElements.length > 0 ? requiredElements.slice(0, 2) : [name]
  };

  // Apply parsed enhancements if provided
  if (parsedEnhancements?.navigableElements && parsedEnhancements.navigableElements.length > 0) {
    structure.navigableElements = parsedEnhancements.navigableElements;
  }

  const result: StructureAnalysis = {
    name,
    perspective,
    structure,
    description: userPrompt
  };

  // Apply furnishing enhancements
  if (parsedEnhancements?.furnishing && parsedEnhancements.furnishing.length > 0) {
    result.furnishingDetails = {
      userSpecified: parsedEnhancements.furnishing,
      suggested: [],
      placementNotes: []
    };
  }

  return result;
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
