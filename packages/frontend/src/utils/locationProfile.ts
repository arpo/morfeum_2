/**
 * Utilities for working with location deep profiles
 */

/**
 * Field keys for world DNA (persistent environmental characteristics)
 */
export const WORLD_DNA_KEYS = [
  "colorsAndLighting",
  "atmosphere",
  "flora",
  "fauna",
  "architecture",
  "materials",
  "genre",
  "symbolicThemes",
  "fictional",
  "copyright"
] as const;

/**
 * Field keys for location instance (scene-specific details)
 */
export const LOCATION_INSTANCE_KEYS = [
  "name",
  "looks",
  "mood",
  "sounds",
  "airParticles"
] as const;

/**
 * Splits a flat deep profile JSON into world and location parts
 */
export function splitWorldAndLocation(flat: Record<string, any>) {
  const world: Record<string, any> = {};
  const location: Record<string, any> = {};

  for (const [key, value] of Object.entries(flat)) {
    if (WORLD_DNA_KEYS.includes(key as any)) {
      world[key] = value;
    } else if (LOCATION_INSTANCE_KEYS.includes(key as any)) {
      location[key] = value;
    } else {
      // Optional: log any unexpected keys for debugging
      console.warn(`splitWorldAndLocation: unrecognized key "${key}"`);
    }
  }

  return { world, location };
}
