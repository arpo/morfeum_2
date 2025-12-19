/**
 * Get dimensional hints based on scale for better image generation
 * Uses tighter, more realistic ranges especially for small spaces
 */
export function getDimensionalHints(scale: string, orientation: string, form: string): string {
  // Tighter dimension ranges for more accurate image generation
  const dimensions: Record<string, { primary: string; secondary: string; height: string }> = {
    small: { primary: '2-4m', secondary: '2-3m', height: '2-3m' },
    medium: { primary: '4-10m', secondary: '3-6m', height: '3-5m' },
    large: { primary: '10-30m', secondary: '8-15m', height: '5-15m' }
  };

  const dim = dimensions[scale] || dimensions.medium;

  // Adjust based on orientation
  if (orientation === 'vertical') {
    return `approximately ${dim.secondary} wide, ${dim.height} to ${dim.primary} tall`;
  } else if (orientation === 'horizontal') {
    return `approximately ${dim.primary} long, ${dim.secondary} wide, ${dim.height} ceiling height`;
  } else if (orientation === 'wide') {
    return `approximately ${dim.primary} wide, ${dim.secondary} deep, ${dim.height} ceiling height`;
  }
  // cubic
  return `approximately ${dim.secondary} in each dimension`;
}
