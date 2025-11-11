/**
 * Context Builders
 * Dynamic builders for extracting and formatting context from node data
 */

import type { FieldMapping } from './fieldMappings';
import {
  LOCATION_DATA_FIELDS,
  DNA_FIELDS,
  MATERIALS_FIELDS,
  COLORS_FIELDS,
} from './fieldMappings';

/**
 * Generic descriptor builder using field mappings
 */
function buildDescriptors(data: any, fields: FieldMapping[]): string[] {
  const descriptors: string[] = [];
  
  for (const field of fields) {
    const value = data?.[field.key];
    
    // Skip empty values
    if (!value) continue;
    if (field.isArray && (!Array.isArray(value) || value.length === 0)) continue;
    
    // Format value
    let formattedValue: string;
    if (field.transform) {
      formattedValue = field.transform(value);
    } else if (field.isArray) {
      formattedValue = value.join(', ');
    } else {
      formattedValue = String(value);
    }
    
    descriptors.push(`${field.label}: ${formattedValue}`);
  }
  
  return descriptors;
}

/**
 * Build location descriptors from node data
 */
export function buildLocationDescriptors(
  nodeData: any,
  exclude: string[] = []
): string[] {
  const fields = LOCATION_DATA_FIELDS.filter(f => !exclude.includes(f.key));
  return buildDescriptors(nodeData, fields);
}

/**
 * Build DNA descriptors
 */
export function buildDNADescriptors(dna: any): string[] {
  if (!dna) return [];
  return buildDescriptors(dna, DNA_FIELDS);
}

/**
 * Build materials description
 */
export function buildMaterialsDescription(nodeData: any): string | null {
  const materials = MATERIALS_FIELDS
    .map(field => nodeData?.[field.key])
    .filter(Boolean);
  
  return materials.length > 0 ? `Materials: ${materials.join(', ')}` : null;
}

/**
 * Build colors description
 */
export function buildColorsDescription(nodeData: any): string | null {
  const colors = COLORS_FIELDS
    .map(field => nodeData?.[field.key])
    .filter(Boolean);
  
  return colors.length > 0 ? `Colors: ${colors.join(', ')}` : null;
}

/**
 * Build complete context string with all descriptors
 */
export function buildCompleteContext(nodeData: any, dna: any): string {
  const descriptors: string[] = [];
  
  // Add location descriptors
  descriptors.push(...buildLocationDescriptors(nodeData));
  
  // Add materials and colors
  const materials = buildMaterialsDescription(nodeData);
  if (materials) descriptors.push(materials);
  
  const colors = buildColorsDescription(nodeData);
  if (colors) descriptors.push(colors);
  
  return descriptors.join('\n');
}
