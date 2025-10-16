/**
 * Entity Data Formatting Templates
 * Templates for formatting entity data for chat impersonation and other uses
 */

export const basicEntityDataFormatting = (name: string, looks: string, wearing: string, personality: string): string => {
  return `Name: ${name}\nAppearance: ${looks}\nWearing: ${wearing}\nPersonality: ${personality}`;
};

export const enhancedEntityDataFormatting = (deepProfile: any): string => {
  return `Name: \n${deepProfile.name} \n\nAppearance:\n${deepProfile.looks}\n\nFace:\n${deepProfile.face}\n\nBody:\n${deepProfile.body}\n\nHair:\n${deepProfile.hair}\n\nWearing:\n${deepProfile.wearing}\n\nSpecific Details:\n${deepProfile.specificDetails}\n\nStyle:\n${deepProfile.style}\n\nPersonality:\n${deepProfile.personality}\n\nSpeech Style:\n${deepProfile.speechStyle}\n\nGender: \n${deepProfile.gender}\n\nNationality:\n${deepProfile.nationality}`;
};
