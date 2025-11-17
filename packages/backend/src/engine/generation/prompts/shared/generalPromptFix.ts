import { fluxRoofFix, NoCreatures, morfeumVibes, qualityPrompt } from "./constants";

export function generalPromptFix(prompt: string): string {
    const fix = `
    ${morfeumVibes}

    ${prompt}

    ${NoCreatures}
    
    ${qualityPrompt}

    `;
    return fix
}