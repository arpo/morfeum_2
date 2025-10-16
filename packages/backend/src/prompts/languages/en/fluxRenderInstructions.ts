/**
 * Flux AI Render Instructions Guidance
 * Comprehensive guide for creating dynamic, cinematic camera instructions
 * Used across location, sublocation, and image generation prompts
 */

export const renderInstructionsGuidance = `[renderInstructions]
Describe the camera’s stance — where it hides, how it leans, and what it sees past or through. Avoid perfect vanishing lines.

**Structure:** framing + angle + composition + depth cues + near/mid/far tension

**ABSOLUTE RULES:**
- No centered corridors
- No full symmetry
- No horizon-line balance
- No straight, eye-level perspective unless dramatically justified

**FAVOR:**
- Diagonal or off-axis composition
- Cropped, uneven, or obstructed framing
- Partial occlusions and layered depth
- Foreground anchors (objects close to lens)
- Parallax between near/mid/far planes
- Hints of movement: smoke, mist, flicker, sway

**1. Camera Behavior**
Think of the lens as a presence within the world:
• "cropped off-axis view, partial column blocking the frame edge"
• "tight diagonal framing breaking perspective alignment"
• "camera half-hidden behind shelving, uneven sightline through haze"
• "handheld-feel, low oblique angle, dynamic left-weighted frame"
• "tilted perspective cutting the vanishing point off-frame"

**2. Depth and Spatial Tension**
Create physical distance between planes:
• "foreground obstruction from a shelf corner, shallow parallax through drifting dust"
• "lens peers between books, far aisle barely visible through haze"
• "near pipes or railings framing distant glow"
• "foreground reflection in puddle breaking the symmetry"

**3. Micro-Drama in Light**
Describe origin and interaction, not generic lighting:
• "hard sidelight from sodium lamps cutting through mist"
• "neon spill from a workshop door grazing wet pavement"
• "bioluminescent bloom seeping from drain grates"
• "diffused predawn blue mixing with orange industrial light"

**4. Environmental Life (without people)**
Show evidence of activity or decay:
• "steam rising from vents"
• "ripples from unseen machinery"
• "wind shifting hanging cables"
• "rain streaking unevenly across glass"

**5. Lens Pack Examples**
• [LENS:] 24mm f/2.8 — near-ground oblique, diagonal depth, foreground intrusion
• [LENS:] 35mm f/2 — handheld, partial occlusion, mid-depth compression
• [LENS:] 85mm f/1.8 — shallow focus, telephoto compression, off-axis tilt

**6. Scene Type Examples**
• Macro/machines: "macro detail, three-quarter angle, diagonal layout, shallow focus with occlusion"
• Interiors: "medium framing, low oblique offset, cropped geometry, layered depth"
• Exteriors: "medium-wide, off-axis elevation, asymmetrical layout, parallax through haze"
• Establishing: "wide, elevated yet tilted frame, horizon broken by structure or terrain"

**7. Complete Examples**
• "tight medium framing, low oblique angle between two shelves, half-hidden view through drifting dust, right-weighted composition with columns cutting the frame"
• "elevated side vantage, wide framing, asymmetrical tunnel view, diagonal rhythm into haze"
• "ground-level shot, diagonal layout, partial obstruction from debris, layered parallax depth"
• "aerial 45° off-axis, sweeping composition with one edge cropped by structure"

If scene details are missing, infer cinematic defaults that favor asymmetry, depth, and visual tension over order or balance.`;
