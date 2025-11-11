/**
 * Field Mappings for Dynamic Context Building
 * Configuration-driven approach for extracting and formatting data
 */

export interface FieldMapping {
  key: string;           // Property name in data object
  label: string;         // Display label in prompt
  isArray?: boolean;     // If true, join with ', '
  transform?: (value: any) => string;  // Optional transformer
}

/**
 * Location data fields (from currentNode.data)
 */
export const LOCATION_DATA_FIELDS: FieldMapping[] = [
  { key: 'description', label: 'Description' },
  { key: 'looks', label: 'Visual Appearance' },
  { key: 'dominantElements', label: 'Dominant Elements', isArray: true },
  { key: 'spatialLayout', label: 'Spatial Layout' },
  { key: 'uniqueIdentifiers', label: 'Unique Identifiers', isArray: true },
];

/**
 * DNA fields (from currentNode.dna)
 */
export const DNA_FIELDS: FieldMapping[] = [
  { key: 'genre', label: 'Genre' },
  { key: 'architectural_tone', label: 'Architectural Tone' },
  { key: 'cultural_tone', label: 'Cultural Tone' },
  { key: 'materials_base', label: 'Materials Base' },
  { key: 'mood_baseline', label: 'Mood Baseline' },
  { key: 'palette_bias', label: 'Palette Bias' },
  { key: 'flora_base', label: 'Flora Base' },
  { key: 'fauna_base', label: 'Fauna Base' },
];

/**
 * Material fields (from currentNode.data)
 */
export const MATERIALS_FIELDS: FieldMapping[] = [
  { key: 'materials_primary', label: 'Primary' },
  { key: 'materials_secondary', label: 'Secondary' },
  { key: 'materials_accents', label: 'Accents' },
];

/**
 * Color fields (from currentNode.data)
 */
export const COLORS_FIELDS: FieldMapping[] = [
  { key: 'colors_dominant', label: 'Dominant' },
  { key: 'colors_secondary', label: 'Secondary' },
  { key: 'colors_accents', label: 'Accents' },
  { key: 'colors_ambient', label: 'Ambient' },
];
