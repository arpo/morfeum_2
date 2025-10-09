/**
 * Flux image generation filters
 * Provides various visual styles and composition presets for image generation
 */

export interface FluxFilter {
  name: string;
  text: string;
  description: string;
}

export const fluxFilters: Record<string, FluxFilter> = {
  "Luminous Contrast": {
    name: "Luminous Contrast",
    text: "high contrast lighting, glowing accents, luminous edges, deep shadows",
    description: "Boosts contrast and edge light; adds dramatic pop and clarity, ideal for vivid portraits or strong shape definition."
  },
  "Bioluminescent Detail": {
    name: "Bioluminescent Detail",
    text: "subtle bioluminescent glow from veins, soft internal light, faint radiance",
    description: "Adds inner light and organic glow; suits supernatural, fantasy, or alien characters."
  },
  "Hyper Saturation": {
    name: "Hyper Saturation",
    text: "rich saturated colors, vivid palette, intense chroma",
    description: "Increases color energy and vibrancy; great for dreamlike or heightened-reality scenes."
  },
  "Aged Texture": {
    name: "Aged Texture",
    text: "focused skin detail: wrinkles, age spots, weathered texture, fine lines",
    description: "Emphasizes age and realism through detailed surface texture."
  },
  "Grit & Decay": {
    name: "Grit & Decay",
    text: "worn surfaces, peeling paint, cracked stone, rusted metal, dust particles",
    description: "Adds age, wear, and imperfection; use for ruins, dystopia, or lived-in realism."
  },
  "Soft Ethereal": {
    name: "Soft Ethereal",
    text: "diffused glow, soft light bloom, gentle haze",
    description: "Creates dreamlike softness and light diffusion; works for spirits, memories, or gentle fantasy."
  },
  "Techno Circuit": {
    name: "Techno Circuit",
    text: "delicate circuitry patterns, faint neon tracings, glowing micro-patterns",
    description: "Introduces futuristic or AI-related surface motifs and subtle neon highlights."
  },
  "Nocturne Glow": {
    name: "Nocturne Glow",
    text: "moody nighttime light, glints of phosphorescence, deep midnight tones",
    description: "For dark, elegant scenes; adds faint ambient glow and nocturnal depth."
  },
  "Cinematic Lens": {
    name: "Cinematic Lens",
    text: "cinematic framing, shallow depth of field, dramatic light flares",
    description: "Gives a filmic composition with focus control and flare; ideal for portrait or story shots."
  },
  "Photographic Grit": {
    name: "Photographic Grit",
    text: "film grain, chromatic aberration, subtle lens artifacts",
    description: "Adds analog realism and tactile imperfection for grounded images."
  },
  "Portrait": {
    name: "Portrait",
    text: "close-up framing, subject centered, shallow depth of field, fine facial detail, soft front light, sharp eyes, blurred background",
    description: "Emphasizes character presence and emotion; works for introductions, profile images, and personal moments."
  },
  "Half Portrait": {
    name: "Half Portrait",
    text: "subject looking at the camera. Face in sharp focus, natural lighting, soft background blur (bokeh), balanced composition emphasizing eyes and expression.",
    description: "Shows both personality and attire; keeps intimacy while revealing environment tone."
  },
  "Landscape Overview": {
    name: "Landscape Overview",
    text: "wide-angle composition, sweeping vista, dramatic horizon, layered depth, volumetric atmosphere, balanced color grading",
    description: "Expansive sense of place; conveys world-building, weather, and geography."
  },
  "Drone Shot": {
    name: "Drone Shot",
    text: "aerial high-angle perspective, dynamic lighting from above, visible topography, long shadows, cinematic sense of scale",
    description: "Gives spatial context and grandeur; perfect for revealing terrain or architecture."
  },
  "Action Scene": {
    name: "Action Scene",
    text: "dynamic motion blur, kinetic energy, expressive poses, flying debris or particles, high shutter speed, intense lighting contrast",
    description: "Captures movement and tension; ideal for battles, chases, or dramatic gestures."
  },
  "Spontaneous Human Interaction": {
    name: "Spontaneous Human Interaction",
    text: "documentary style, candid posture, imperfect framing, natural light, slight motion blur, authentic expression",
    description: "Feels real and unposed; evokes connection, laughter, or fleeting emotion."
  },
  "Intimate Scene": {
    name: "Intimate Scene",
    text: "close personal distance, soft diffused light, warm skin tones, shallow focus on faces or hands, gentle lens flare",
    description: "Invokes tenderness or vulnerability; useful for quiet conversations or affection."
  },
  "Ethereal": {
    name: "Ethereal",
    text: "soft diffusion, glowing edges, floating particles, translucent color palette, gentle haze, slow light transitions",
    description: "Creates dreamlike atmosphere; works for memory fragments, spiritual presences, or transcendence."
  },
  "Selfie": {
    name: "Selfie",
    text: "handheld framing, slight distortion, direct gaze, mixed lighting, realistic camera artifacts, casual posture",
    description: "Feels immediate and personal; connects viewer directly with the subject."
  },
  "Cinematic Establishing Shot": {
    name: "Landscape Overview",
    text: "wide shot with realistic lens optics, asymmetrical composition, slight camera offset or diagonal framing, visible foreground elements adding depth",
    description: "A grounded, photo-realistic overview with natural imbalance and spatial depth; avoids perfect symmetry and feels like a moment captured rather than staged."
  },
  "Dream Fragment": {
    name: "Dream Fragment",
    text: "low contrast, selective blur, surreal light direction, floating focus, disjoint color balance",
    description: "Suggests partial memory or hallucination; ideal for symbolic or subconscious scenes."
  }
};

/**
 * Get a filter by name
 * @param filterName - Name of the filter to retrieve
 * @returns The filter object or undefined if not found
 */
export const getFluxFilter = (filterName: string): FluxFilter | undefined => {
  return fluxFilters[filterName];
};

/**
 * Get the default filter (Half Portrait)
 * @returns The default Half Portrait filter
 */
export const getDefaultFluxFilter = (): FluxFilter => {
  return fluxFilters["Half Portrait"];
};
