/**
 * Build a rich system prompt for character chat
 * Includes full character DNA and environment context
 */

export interface CharacterDetails {
  name: string;
  looks: string;
  wearing: string;
  face?: string;
  body?: string;
  hair?: string;
  specificDetails?: string;
  style?: string;
  personality: string;
  voice?: string;
  speechStyle?: string;
  gender?: string;
  nationality?: string;
  tags?: string;
  context?: string; // Original user prompt / backstory (e.g., "on vacation staying in this house")
}

export interface EnvironmentContext {
  locationName?: string;
  locationDescription?: string;
  environmentDNA?: string;
  atmosphere?: string;
}

/**
 * Build a comprehensive system prompt for character chat
 * Includes all character DNA and current environment context
 */
export function buildCharacterSystemPrompt(
  character: CharacterDetails,
  environment?: EnvironmentContext
): string {
  const sections: string[] = [];

  // Identity
  sections.push(`You are ${character.name}.`);

  // Context/Backstory (from original user prompt)
  if (character.context) {
    sections.push(`\nBACKSTORY:\n${character.context}`);
  }

  // Physical appearance
  if (character.looks || character.face || character.body || character.hair) {
    const appearance: string[] = [];
    if (character.looks) appearance.push(character.looks);
    if (character.face) appearance.push(`Face: ${character.face}`);
    if (character.body) appearance.push(`Build: ${character.body}`);
    if (character.hair) appearance.push(`Hair: ${character.hair}`);
    if (character.specificDetails) appearance.push(character.specificDetails);
    
    sections.push(`\nAPPEARANCE:\n${appearance.join('\n')}`);
  }

  // Clothing
  if (character.wearing) {
    sections.push(`\nCLOTHING:\n${character.wearing}`);
  }

  // Personality and behavior
  if (character.personality) {
    sections.push(`\nPERSONALITY:\n${character.personality}`);
  }

  // Voice and speech
  if (character.voice || character.speechStyle) {
    const voice: string[] = [];
    if (character.voice) voice.push(`Voice: ${character.voice}`);
    if (character.speechStyle) voice.push(`Speech style: ${character.speechStyle}`);
    sections.push(`\nVOICE & SPEECH:\n${voice.join('\n')}`);
  }

  // Style/aesthetic
  if (character.style) {
    sections.push(`\nAESTHETIC:\n${character.style}`);
  }

  // Environment context
  if (environment && (environment.locationName || environment.locationDescription || environment.environmentDNA)) {
    const envParts: string[] = [];
    if (environment.locationName) {
      envParts.push(`You are currently in ${environment.locationName}.`);
    }
    if (environment.locationDescription) {
      envParts.push(environment.locationDescription);
    }
    if (environment.environmentDNA) {
      envParts.push(environment.environmentDNA);
    }
    if (environment.atmosphere) {
      envParts.push(`Atmosphere: ${environment.atmosphere}`);
    }
    sections.push(`\nCURRENT ENVIRONMENT:\n${envParts.join('\n')}`);
  }

  // Instructions
  sections.push(`\nINSTRUCTIONS:
- Stay in character at all times
- Respond as ${character.name} would, with their personality and speech style
- Be aware of your physical presence and surroundings
- Your responses should reflect your character's voice and mannerisms
- Keep responses conversational and natural`);

  return sections.join('\n');
}

/**
 * Build a minimal system prompt (fallback for basic seed data)
 */
export function buildMinimalSystemPrompt(name: string, personality?: string): string {
  return `You are ${name}. ${personality || 'Respond naturally and stay in character.'}`;
}
