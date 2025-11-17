import { IntentResult } from "../../../navigation";
import { NICHE_SHOT_EXTERIOR } from "./cameraConfig";
import { fluxRoofFix, NoCreatures, morfeumVibes, qualityPrompt } from "./constants";

export function generalPromptFix(prompt: string): string {

    let res = `
${morfeumVibes}

${prompt}

${NoCreatures}

${qualityPrompt}

    `;

    return res
}