import { generalRules, morfeumVibes, qualityPrompt } from "./constants";

export function generalPromptFix(prompt: string): string {
    const fix = `
    ${morfeumVibes}

    ${prompt}

    ${generalRules}
    
    ${qualityPrompt}

    `;
    return fix
}