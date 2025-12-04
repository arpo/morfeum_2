/**
 * Perspective detection utility for node image generation
 */

/**
 * Detect perspective from node data for image generation
 */
export function detectPerspectiveFromNode(node: any): 'interior' | 'exterior' {
  const description = (node.description || node.name || '').toLowerCase();
  
  const interiorWords = ['inside', 'interior', 'room', 'hall', 'chamber', 'within', 'indoor'];
  if (interiorWords.some(word => description.includes(word))) {
    return 'interior';
  }

  const exteriorWords = ['outside', 'exterior', 'street', 'garden', 'rooftop', 'terrace', 'outdoor'];
  if (exteriorWords.some(word => description.includes(word))) {
    return 'exterior';
  }

  // Default to exterior for most cases
  return 'exterior';
}
