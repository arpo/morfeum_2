# Active Context

## Current Focus
- **Flux-Friendly Image Prompts:** Restructured all image prompts to use explicit block format that Flux respects.
- **Visual Hierarchy & Camera Settings:** Refined camera/lens settings for Host, Region, and Location nodes to produce distinct perspectives.
- **Host Altitude Fix:** Changed Host from orbital/satellite (ignored by Flux) to high-altitude drone/aircraft (respected by Flux).

## Recent Changes
- **Image Generation (`image/index.ts`) - Flux Block Format:**
    - Restructured ALL image prompts to use explicit blocks: `[ENV:]`, `[SHOT:]`, `[LENS:]`, `[LIGHT:]`, `[COLOR:]`, `[MOOD:]`, `[STYLE:]`, `[NEG:]`
    - This format ensures Flux respects camera instructions instead of ignoring them.
    
- **Host Image Prompt (latest fix):**
    - Changed from "orbital/satellite" to "high-altitude aerial drone/aircraft"
    - Changed lens from 12mm to 18mm equivalent
    - Added specific altitude: ~800m-1500m
    - Removed "curvature visible" and added "no curvature"
    - Added to [NEG:]: "orbital curvature, extreme altitude, satellite mapping look"
    
- **Camera Hierarchy:**
    - **Host**: 18mm, f/8, ~800m-1500m altitude, 25-35° tilt (aerial/drone)
    - **Region**: 24mm, f/5.6, 45° tilt (mid-altitude drone)
    - **Location**: 35mm, f/2.8, eye-level (ground)
    - **Niche**: 24mm/35mm, f/4, eye-level (interior/exterior detail)

- **DNA Generation (`completeDNAGeneration.ts`):**
    - Updated HOST to "The City/Metropolis" with SATELLITE / MAP VIEW perspective
    - Added PLURALITY RULE for Host (use plural forms like "buildings", "districts")
    - Added explicit negative examples for Host to prevent single-building descriptions

## Next Steps
- Test the new Flux block format to verify camera instructions are being followed.
- Monitor for any remaining issues with Host perspective being too close.
- Continue refining lens/altitude settings if needed.
