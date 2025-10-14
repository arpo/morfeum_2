/**
 * Sublocation Generation Service
 * Generates sublocation DNA using cascaded visual context from parent hierarchy
 */

import { generateText } from './mzoo.service';
import { generateSublocationDNA as generateSublocationPrompt } from '../prompts/languages/en/sublocationGeneration';
import { AI_MODELS } from '../config/constants';

/**
 * Generate sublocation DNA from cascaded visual context
 */
export const generateSublocationDNA = async (
  apiKey: string,
  sublocationName: string,
  cascadedContext: any
): Promise<any> => {
  const prompt = generateSublocationPrompt(sublocationName, cascadedContext);
  
  const result = await generateText(
    apiKey,
    [{ role: 'user', content: prompt }],
    AI_MODELS.PROFILE_ENRICHMENT
  );
  
  if (result.error || !result.data) {
    throw new Error(`Failed to generate sublocation DNA: ${result.error || 'No response from AI'}`);
  }
  
  // Parse JSON response - MZOO service returns {text: "...", model: "...", usage: {}}
  try {
    // Extract the text field
    let jsonText: string;
    if (typeof result.data === 'string') {
      jsonText = result.data;
    } else if (result.data && typeof result.data === 'object' && 'text' in result.data) {
      jsonText = (result.data as any).text;
    } else {
      jsonText = JSON.stringify(result.data);
    }
    jsonText = jsonText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.lastIndexOf('```')).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3, jsonText.lastIndexOf('```')).trim();
    }
    
    console.log('[Sublocation Service] Parsing JSON, length:', jsonText.length);
    
    const sublocationDNA = JSON.parse(jsonText);
    
    console.log('[Sublocation Service] Successfully parsed sublocation DNA');
    
    return sublocationDNA;
  } catch (parseError) {
    console.error('[Sublocation Service] JSON parse error:', parseError);
    console.error('[Sublocation Service] Raw response:', result.data);
    throw new Error(`Failed to parse sublocation DNA JSON: ${parseError}`);
  }
};
