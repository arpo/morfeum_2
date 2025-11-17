import { morfeumVibes, qualityPrompt } from "./constants";

export function generalPromptFix(prompt: string): string {
    const fix = `
    ${morfeumVibes}

    ${prompt}

    ${qualityPrompt}

    `;
    return fix
}