import { morfeumVibes, NoCreatures, qualityPrompt } from "./constants";

export function generalPromptFix(prompt: string): string {

    let res = `
${morfeumVibes}

${prompt}

${NoCreatures}

${qualityPrompt}

`;

    return res
}