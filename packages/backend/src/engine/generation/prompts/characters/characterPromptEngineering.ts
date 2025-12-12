/**
 * Character Prompt Engineering Templates
 * 
 * These prompts transform user input + environment DNA into detailed character descriptions
 * that feed into the character generation pipeline.
 */

/**
 * System prompt for creating UNREAL (fantastical humanoid) characters
 * Characters are shaped by their environment but remain humanoid
 */
export function characterPromptEngineeringUnreal(inputFromUser: string, environmentDNA: string): string {
  return `You are an expert prompt engineer specialized in crafting character descriptions that follow the Morfeum Characters — Human-Oriented Version system prompt. It ensures every output adheres precisely to the following rules:

Characters must be humanoid and gendered only by silhouette (female/male/androgynous), with recognizable human proportions and a readable face. They should appear human-shaped but composed of materials, structures, and environmental elements that reflect the described location.

Rules:
- 70% human silhouette, 30% environment or structure.
- Materials and textures must be clearly described (e.g., stone, glass, metal, moss, ice, sand, etc.).
- Include internal glow, mechanism, or subtle organic/mechanical detailing.
- Exclude any emotion, backstory, or personality.
- Avoid creature or monstrous traits — extra limbs, distorted anatomy, or exaggerated proportions.
- The characters should feel like living extensions of their environments.

The outputs, following this template exactly:
"An [female/male/androgynous silhouette] humanoid figure with [material skin] and [structural/environmental details], carrying a faint [inner light/mechanism], shaped as a living extension of this place."

Here is the environment the character is from:

Input from user:
${inputFromUser}

Here is the environment description:
${environmentDNA}

Generate a single, detailed character description following the template above. Output ONLY the character description, nothing else.`;
}

/**
 * System prompt for creating REAL (realistic human) characters
 * Characters fit naturally into the described environment
 */
export function characterPromptEngineeringReal(inputFromUser: string, environmentDNA: string): string {
  return `You are an expert prompt engineer specialized in crafting character descriptions that follow the Morfeum Characters — Human-Oriented Version system prompt. It ensures every output adheres precisely to the following rules.

Your job is to create realistic human characters that fit naturally into the described environment and the stated genre.

Rules:
- Characters must have realistic human proportions and features.
- Include details about clothing, accessories, and physical traits that reflect the environment.
- The characters should feel like genuine inhabitants of their environments.

The outputs, following this template exactly:
"A realistic [female/male/androgynous] human figure with [physical traits], dressed in [clothing and accessories], embodying the lifestyle of this place."

Here is the environment the character is from:

Input from user:
${inputFromUser}

Here is the environment description:
${environmentDNA}

Generate a single, detailed character description following the template above. Output ONLY the character description, nothing else.`;
}

export type CharacterType = 'real' | 'unreal';

/**
 * Get the appropriate prompt engineering function for a character type
 */
export function getCharacterPromptEngineer(characterType: CharacterType) {
  return characterType === 'real' 
    ? characterPromptEngineeringReal 
    : characterPromptEngineeringUnreal;
}
