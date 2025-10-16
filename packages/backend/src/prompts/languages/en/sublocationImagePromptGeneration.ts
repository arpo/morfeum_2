/**
 * Sublocation Image Prompt Generation
 * LLM converts DNA into optimized FLUX image prompt
 */
import { morfeumVibes, qualityPrompt } from './constants';
import { renderInstructionsGuidance } from './fluxRenderInstructions';

export const sublocationImagePromptGeneration = (
  dna: any,
  cascadedContext: any
) => {
  const dnaJson = JSON.stringify(dna, null, 2);
  const contextJson = JSON.stringify(cascadedContext, null, 2);

  // TODO: Pick what data to include from context see example below

  const rv = `You are an expert at creating FLUX image generation prompts for immersive fantasy/sci-fi locations.

TASK: Convert the following sublocation DNA into a single, coherent FLUX image prompt.

SUBLOCATION DNA:
${dnaJson}

CASCADED WORLD CONTEXT:
${contextJson}

INSTRUCTIONS:
${renderInstructionsGuidance}
- Create a vivid, detailed FLUX prompt that captures the essence of this sublocation
- Include visual anchors (dominant elements, spatial layout, materials, colors)
- Incorporate the atmosphere, mood, and symbolic themes
- Reference the world context (genre, architectural tone, palette)
- Use rich, evocative language
- Be specific and concrete, avoid generic terms
- Ensure the scene is coherent and visually engaging

STRUCTURE YOUR PROMPT:
1. Start with: "${morfeumVibes}"
2. Location name and key visual details
3. Atmosphere and mood
4. Materials and surfaces
5. Colors and lighting
6. Visual anchors and spatial layout
7. Symbolic themes and unique identifiers
8. World context elements (genre, architectural style)
9. End with quality guidelines

WORLD RULES TO INCLUDE:
- No human or animal figures appear unless explicitly mentioned
- Water, when visible, is calm and mirror-still, reflecting light softly

QUALITY DIRECTIVE TO ADD AT END:
${qualityPrompt}

OUTPUT: Return ONLY the final FLUX image prompt as plain text, no explanations or JSON.`;



  return rv;
};

// EXAMPLE DNA & CONTEXT FOR TESTING:
// You are an expert at creating FLUX image generation prompts for immersive fantasy/sci-fi locations.

// TASK: Convert the following sublocation DNA into a single, coherent FLUX image prompt.

// SUBLOCATION DNA:
// meta.name

// {
//   "meta": {
//     "name": "The Rooftop Bar"
//   },
//   "semantic": {
//     "environment": "outdoor type",
//     "terrain_type": "open area",
//     "structures": [
//       {
//         "type": "bar counter",
//         "material": "corrugated metal",
//         "color": "rusted brown/dark gray",
//         "condition": "decayed, rusted"
//       },
//       {
//         "type": "seating",
//         "material": "scrap metal/repurposed industrial parts",
//         "color": "dark gray, red graffiti accents",
//         "condition": "makeshift, weathered"
//       },
//       {
//         "type": "overhead awning",
//         "material": "tattered canvas/corrugated metal sheeting",
//         "color": "faded blues and reds",
//         "condition": "torn, rusted supports"
//       },
//       {
//         "type": "architectural element",
//         "material": "exposed wires",
//         "color": "black/metallic",
//         "condition": "frayed, sparking intermittently"
//       }
//     ],
//     "vegetation": {
//       "types": [
//         "scrappy weeds",
//         "lichen"
//       ],
//       "density": "sparse"
//     },
//     "fauna": {
//       "types": [
//         "insects"
//       ],
//       "presence": "ambient"
//     },
//     "lighting": "outdoor lighting (natural/artificial)",
//     "weather_or_air": "still, damp air with a faint metallic tang",
//     "atmosphere": "exposed, overlooking",
//     "mood": "enigmatic and foreboding, imbued with a sense of survivalist mystery",
//     "color_palette": [
//       "dark grays and browns",
//       "deep reds and blues",
//       "vibrant pinks and cyans"
//     ],
//     "soundscape": [
//       "distant city hum",
//       "wind whistling through metal",
//       "occasional metallic clangs"
//     ]
//   },
//   "spatial": {
//     "scale": {
//       "ceiling_height_m": null,
//       "room_length_m": null,
//       "room_width_m": null
//     },
//     "placement": {
//       "key_subject_position": "The bar counter, a long, rusted structure, stretches across the furthest edge of the rooftop.",
//       "camera_anchor": "entry threshold"
//     },
//     "orientation": {
//       "dominant_view_axis": "axial"
//     },
//     "connectivity": {
//       "links_to": [
//         "The Lumina Carvings"
//       ]
//     }
//   },
//   "profile": {
//     "looks": "This rooftop bar is a precarious perch atop the decaying industrial structures. Rusted corrugated metal forms the foundation and makeshift bar, littered with remnants of past attempts at comfort and utility. The vast, open sky above is the only ceiling, contrasting with the enclosed, almost suffocating atmosphere of the lower levels.",
//     "colorsAndLighting": "Deep reds and blues from glowing graffiti bleed into the twilight, casting a harsh, saturated glow across the weathered surfaces, punctuated by pools of unnatural vibrant pinks and cyans.",
//     "atmosphere": "The air here is heavy and stagnant, carrying the metallic tang of decay and a faint electric ozone smell. A subtle, cool blue haze drifts at the edges of perception, hinting at the enclosed, humid environment below.",
//     "materials": "Dominated by heavily rusted, corrugated metal, the surfaces are scarred and weathered, interspersed with scattered debris like gravel and refuse, along with the stark presence of exposed, frayed wires.",
//     "mood": "The space offers a bleak sense of defiant existence, a testament to survival in a desolate, beautiful ruin, tinged with an unnerving mystery.",
//     "sounds": "drip, echo, metallic scrape, faint hum, wind",
//     "symbolicThemes": "Survivalist defiance and desolate beauty",
//     "airParticles": "A fine, almost imperceptible mist hangs in the air, catching the light.",
//     "fictional": true,
//     "copyright": false,
//     "visualAnchors": {
//       "dominantElements": [
//         "A long, heavily rusted corrugated metal bar counter dominating the edge of the rooftop.",
//         "Makeshift seating constructed from scrap metal and industrial remnants scattered across the open space.",
//         "Tattered sections of overhead awning, clinging precariously to rusted supports.",
//         "A dense network of exposed, frayed wires, some intermittently sparking with an unsettling blue light."
//       ],
//       "spatialLayout": "The Rooftop Bar is an expansive, open-air platform defined by its boundary of decaying industrial structures. It functions as a large, flat courtyard-like space, with the primary focal point being the bar counter situated along the furthest edge, offering a panoramic yet restricted view.",
//       "surfaceMaterialMap": {
//         "primary_surfaces": "corrugated metal (walls of surrounding structures, bar counter, flooring)",
//         "secondary_surfaces": "scrap metal (seating), tattered canvas (awning), gravel, soil, refuse (ground debris)",
//         "accent_features": "exposed wires, pooled liquid (possibly from the damp air or leaks)"
//       },
//       "colorMapping": {
//         "dominant": "Dark grays and browns from heavily rusted metal and debris, covering the majority of visible surfaces.",
//         "secondary": "Deep reds and blues from the pervasive graffiti, forming large swathes of color.",
//         "accent": "Vibrant pinks and cyans from specific graffiti tags and intermittent electrical sparks, highlighting smaller areas.",
//         "ambient": "A cool, hazy blue light emanating from the distance, blending with the low-saturation natural light of dusk or a heavily overcast sky."
//       },
//       "uniqueIdentifiers": [
//         "The precariousness of the open-air setting combined with the intimacy of a 'bar' concept.",
//         "The stark contrast between the vast sky and the enclosed, claustrophobic feeling inherited from below.",
//         "The intermittent, unsettling sparks from exposed wiring against the backdrop of decaying metal."
//       ]
//     },
//     "searchDesc": "[Sublocation - Exterior] A decayed rooftop bar with rusted metal, graffiti, and stark, eerie lighting."
//   }
// }

// CASCADED WORLD CONTEXT:
// {
//   "parentLocationName": "The Lumina Carvings",
//   "atmosphere": "The air is still, damp, and heavy, carrying a faint metallic tang and the scent of decay mixed with an electric ozone smell. A visible haze or mist drifts near the vanishing point, suggesting an enclosed and stagnant environment. The overall sensory quality is dense and palpable, almost electric.",
//   "mood": "The mood is enigmatic and foreboding, imbued with a sense of survivalist mystery. The decaying industrial setting combined with the vibrant, unnatural light evokes a feeling of desolate, beautiful decay.",
//   "colorsAndLighting": "Dominant colors are deep reds and blues emanating from the glowing graffiti, creating high contrast with dark, shadowed areas. The light is harsh, saturated, and strongly directional, casting uneven glows and reflections on wet surfaces. A cool, hazy blue ambient light seems to emanate from the far end of the corridor.",
//   "materials": "The primary surfaces are heavily rusted, corrugated metal walls and floors. Secondary materials include metal train tracks and scattered debris like gravel, soil, and refuse. Accent features include exposed wires and pooled liquid.",
//   "lighting": "Dominant colors are deep reds and blues emanating from the glowing graffiti, creating high contrast with dark, shadowed areas. The light is harsh, saturated, and strongly directional, casting uneven glows and reflections on wet surfaces. A cool, hazy blue ambient light seems to emanate from the far end of the corridor.",
//   "architectural_tone": "decayed industrial metal",
//   "palette": [
//     "Deep reds and blues from graffiti and ambient light",
//     "Dark grays and browns from metal and debris",
//     "Vibrant pinks and cyans from specific graffiti elements"
//   ],
//   "dominant_materials": [
//     "Corrugated metal walls and floors with extensive rust and texture",
//     "Metal train tracks, debris on floor (soil, gravel, refuse)"
//   ],
//   "soundscape": [
//     "drip",
//     "echo",
//     "metallic scrape",
//     "faint hum"
//   ],
//   "environment": "",
//   "genre": "",
//   "structures": []
// }

// INSTRUCTIONS:

// [renderInstructions]
// Describe the camera’s stance — where it hides, how it leans, what it sees past or through. Favor elevated or oblique views over ground-level shots.

// **Core:** framing + angle + composition + depth + near/mid/far tension  

// **RULES:**
// - No centered corridors or full symmetry  
// - No horizon-line balance  
// - No straight, low, or human-eye perspectives unless essential  

// **Favor:** diagonal, off-axis composition • cropped edges • occlusion • layered depth • foreground anchors • parallax • subtle motion (smoke, mist, flicker)

// **Camera Presence:**  
// “elevated oblique view, partial structure cutting frame edge”  
// “high side vantage, uneven sightline through haze”  
// “aerial 45° tilt, diagonal layout breaking vanishing point”  

// **Depth & Light:**  
// “foreground obstruction from railings, shallow parallax through mist”  
// “hard sidelight cutting through haze”  
// “neon spill grazing wet pavement”  
// “diffused dawn light mixing with sodium glow”

// **Environmental Life:**  
// “steam drifting from vents” • “wind shifting cables” • “rain streaking glass”  

// **Lenses:**  
// 24mm f/2.8 — elevated wide, diagonal sweep, foreground intrusion  
// 35mm f/2 — oblique, partial occlusion, mid-depth  
// 85mm f/1.8 — telephoto compression, off-axis tilt  

// **Scene Types:**  
// Macro — diagonal detail, shallow focus, occlusion  
// Interior — medium framing, elevated offset, cropped geometry  
// Exterior — wide oblique, asymmetrical layout, parallax through haze  
// Establishing — high vantage, tilted horizon, layered terrain  

// **Examples:**  
// “elevated side view through hanging cables, diagonal composition fading into haze”  
// “aerial 45° off-axis frame, one edge cropped by rooftop structure”

// Default to height, asymmetry, and depth over balance or symmetry.
// Use light and environmental elements to add texture and life.

// - Create a vivid, detailed FLUX prompt that captures the essence of this sublocation
// - Include visual anchors (dominant elements, spatial layout, materials, colors)
// - Incorporate the atmosphere, mood, and symbolic themes
// - Reference the world context (genre, architectural tone, palette)
// - Use rich, evocative language
// - Be specific and concrete, avoid generic terms
// - Ensure the scene is coherent and visually engaging

// STRUCTURE YOUR PROMPT:
// 1. Start with: "Morfeum aesthetic — hyper-realistic, high-contrast visuals with sharp light, glowing bioluminescence, and richly saturated tones. Surfaces feel alive; darkness holds depth, not gloom. Reality, one notch brighter."
// 2. Location name and key visual details
// 3. Atmosphere and mood
// 4. Materials and surfaces
// 5. Colors and lighting
// 6. Visual anchors and spatial layout
// 7. Symbolic themes and unique identifiers
// 8. World context elements (genre, architectural style)
// 9. End with quality guidelines

// WORLD RULES TO INCLUDE:
// - No human or animal figures appear unless explicitly mentioned
// - Water, when visible, is calm and mirror-still, reflecting light softly

// QUALITY DIRECTIVE TO ADD AT END:
// best quality, 4k, ultra-detailed, hyper-realistic, vivid color grading, high contrast, glowing highlights, dynamic lighting, volumetric glow, crisp focus

// OUTPUT: Return ONLY the final FLUX image prompt as plain text, no explanations or JSON.