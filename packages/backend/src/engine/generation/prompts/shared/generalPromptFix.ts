import { fluxRoofFix, generalRules, morfeumVibes, qualityPrompt } from "./constants";

/**
 * Apply general prompt fixes and rules
 * @param prompt - The base prompt to enhance
 * @param spaceType - Type of space ('interior' or 'exterior'), determines if ceiling rule applies
 */
export function generalPromptFix(prompt: string, spaceType: 'interior' | 'exterior' | 'unknown' = 'unknown'): string {
    // Only apply ceiling rule for interior spaces
    const roofRule = spaceType === 'interior' ? fluxRoofFix : '';
    
    const fix = `
    ${morfeumVibes}

    ${prompt}

    ${generalRules}
    
    ${qualityPrompt}

    ${roofRule}

    `;
    return fix;
}
