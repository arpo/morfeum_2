const navigableElementsTemplate1 = `5. COMPOSITION (MUST include NAVIGABLE ELEMENTS *inside* these layers)
[COMPOSITION:]
- **Foreground:**  
  Floor textures, entry-level details, and bases of structures shaped by FORM + SCALE.  
  MUST include 1 navigable element with visual prominence  
  (e.g., "illuminated stone steps rising left with soft glow [navigable: stairs, left]").

- **Midground:**  
  Core architectural structures influenced by FORM (columns, walls, curvature, arches).  
  MUST include 1-2 navigable elements with clear visibility (THIS IS THE MOST VISIBLE LAYER)  
  (e.g., "spotlit arched doorway on right, polished metal frame contrasting rough stone [navigable: door, right wall]").

- **Background:**  
  The dominant spatial cue based on STRUCTURE TYPE:  
    • Vertical → soaring ceiling with stated height  
    • Horizontal → long corridor or passage with stated depth  
    • Wide → far curved walls or domed ceiling with stated diameter  
  MAY include 1 navigable element if space allows  
  (e.g., "distant glowing platform [navigable: platform, far center]").

**NAVIGABLE ELEMENT REQUIREMENTS (CRITICAL):**  
- MINIMUM: 2-3 navigable elements total across all layers
- All navigable elements must be placed *inside Foreground, Midground, or Background*, never outside the COMPOSITION block
- Allowed types: passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object

**VISUAL PROMINENCE FOR NAVIGABLE ELEMENTS (CRITICAL):**
Make navigable elements highly visible and distinct through:
- **Lighting:** Illuminate with distinct light sources (glowing edges, spotlit, pools of light, bioluminescent markers, highlighted)
- **Material Contrast:** Use contrasting materials (polished metal vs rough stone, smooth vs textured, different finishes)
- **Color Differentiation:** Different color/tone from surrounding surfaces (warmer glow, cooler metal, brighter accents)
- **Spatial Position:** Well-positioned, unobstructed, clearly framed, prominent placement
- **Scale & Clarity:** Human-scale, adequately sized to be obvious, sharply defined edges
- **Examples:** 
  - "Corridor entrance bathed in warm orange glow, polished bronze frame" 
  - "Spiral staircase illuminated by bioluminescent vines, contrasting dark metal against pale stone"
  - "Archway with distinct blue-white light spilling through, ornate carved frame"`

const navigableElementsTemplate2 = `5. COMPOSITION
Embed 2-3 NAVIGABLE ELEMENTS total.
ALLOWED TYPES: passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object.
VISIBILITY: Elements MUST be distinct via lighting (glow/spotlight), material contrast, or color pop.

[COMPOSITION]
- **Foreground:** Floor/entry details. MUST include 1 element.
  (e.g., "illuminated stone steps [navigable: stairs, left]")
- **Midground:** Core architecture/walls. MUST include 1-2 elements.
  (e.g., "spotlit metal archway [navigable: door, right]")
- **Background:** Dominant spatial cue (Vertical=Height, Horizontal=Depth, Wide=Curve). Optional element.`

export const navigableElementsTemplate = navigableElementsTemplate2;