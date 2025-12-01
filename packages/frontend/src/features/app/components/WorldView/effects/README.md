# WorldView Effects System

This document describes the particle, post-processor, and scene effects available in the WorldView component.

## Table of Contents
- [Particle System](#particle-system)
- [Post-Processor System](#post-processor-system)
- [Color Effects](#color-effects)
- [Scene Presets](#scene-presets)
- [Configuration](#configuration)
- [Runtime API](#runtime-api)

---

## Particle System

The particle system renders floating particles (dust, snow, sparks, etc.) using Three.js Points with custom shaders for soft circular particles.

### Particle Configuration (in `config.ts`)

```typescript
PARTICLES: {
  ENABLED: true,      // Enable/disable particle rendering
  PRESET: 'dust',     // Which preset to use (see below)
  DEPTH: 4,           // Z-axis depth range (affects perspective size variation)
}
```

### Settings Explained

| Setting | Type | Description |
|---------|------|-------------|
| `ENABLED` | boolean | Turn particles on/off |
| `PRESET` | string | Name of the particle preset to use |
| `DEPTH` | number | Controls how far particles spread in the z-axis. Higher values = more depth variation, particles further from camera appear smaller |

### Depth Setting Details

- `DEPTH: 2` — Shallow (default) — particles in z-range -1 to +1
- `DEPTH: 4` — Moderate — particles in z-range -2 to +2  
- `DEPTH: 6` — Deep — particles in z-range -3 to +3

Particles further from the camera automatically appear smaller due to perspective scaling in the vertex shader.

### Available Presets

| Preset | Description | Best For |
|--------|-------------|----------|
| `dust` | Gentle floating motes, white, subtle | Default ambient atmosphere |
| `snow` | Falling snowflakes, white, medium size | Winter scenes |
| `rain` | Fast falling raindrops, blue-tinted | Rainy weather |
| `fireflies` | Flickering glowing particles, yellow | Night scenes, magical |
| `embers` | Rising orange sparks | Fire scenes, volcanoes |
| `fog` | Large slow-moving particles, very transparent | Misty/foggy atmosphere |
| `bubbles` | Rising blue particles | Underwater scenes |
| `sparks` | Fast rising bright particles, erratic | Explosions, machinery |
| `stars` | Stationary twinkling points | Night sky, space |
| `ash` | Slow falling dark particles | Post-apocalyptic, volcanic |
| `pollen` | Yellow floating particles, gentle drift | Spring/nature scenes |

### Behaviors

- **float** — Gentle drifting with turbulence (dust, pollen)
- **fall** — Gravity-affected falling, resets at bottom (snow, rain, ash)
- **rise** — Upward movement, resets at top (embers, sparks, bubbles)
- **flicker** — Slow random movement with opacity pulsing (fireflies, stars)

### Wind Gusts

Particles support temporary wind gusts that push all particles in a direction:

```typescript
// Trigger a wind gust
renderer.triggerWindGust(strengthX, strengthY, duration);

// Example: Strong gust to the right lasting 2 seconds
renderer.triggerWindGust(3, 0, 2);

// Example: Diagonal gust up-right
renderer.triggerWindGust(2, 1, 1.5);
```

Wind gusts use smooth ease-in-out timing for natural movement.

---

## Post-Processor System

The post-processor applies full-screen effects including displacement and color modifications.

### Displacement Effects

| Preset | Description | Visual Effect |
|--------|-------------|---------------|
| `heatwave` | Rising shimmer like heat from hot surface | Vertical wavy distortion, stronger at bottom |
| `underwater` | Wavy refraction like light through water | Multi-directional wave displacement |
| `glitch` | Digital corruption effect | Horizontal bands, scan lines, chromatic split |
| `dream` | Soft pulsing distortion | Breathing waves, organic movement |

---

## Color Effects

Color effects can be layered on top of displacement effects. All color effects use values from 0-1 unless otherwise noted.

### Available Color Effects

| Effect | Range | Description |
|--------|-------|-------------|
| `vignette` | 0-1 | Darkens edges of the screen, draws focus to center |
| `bloom` | 0-1 | Brightens bright areas, creates soft glow |
| `desaturate` | 0-1 | Removes color (0 = full color, 1 = grayscale) |
| `tint` | RGB (0-2) | Multiplies colors by RGB values |
| `tintStrength` | 0-1 | How strongly tint is applied |
| `lightning` | 0-1 | Bright flash that auto-decays |

### Color Effect Examples

```typescript
// Add dark vignette
renderer.setVignette(0.5);

// Add warm orange tint
renderer.setTint(1.2, 0.9, 0.7, 0.5);  // r, g, b, strength

// Add soft glow to bright areas
renderer.setBloom(0.4);

// Desaturate for eerie look
renderer.setDesaturate(0.6);

// Trigger lightning flash
renderer.triggerLightning(0.8);  // Auto-decays

// Set multiple effects at once
renderer.setColorEffects({
  vignette: 0.5,
  bloom: 0.3,
  tint: { r: 0.8, g: 0.9, b: 1.1 },
  tintStrength: 0.4,
});

// Reset all color effects
renderer.resetColorEffects();
```

---

## Scene Presets

Scene presets combine particles, displacement effects, and color effects into themed configurations.

### Available Scenes

| Scene | Particles | Displacement | Color Effects | Special |
|-------|-----------|--------------|---------------|---------|
| `sunset` | pollen | heatwave | Warm orange tint, bloom, light vignette | — |
| `storm` | rain | none | Cold blue-gray, dark vignette, desaturated | Wind gusts, Lightning |
| `underwater` | bubbles | underwater | Cyan tint, light vignette | — |
| `haunted` | fog | dream | Cold tint, heavy vignette, desaturated | — |
| `magical` | fireflies | dream | Light green tint, bloom, vignette | — |

### Scene Details

#### Sunset
- **Atmosphere:** Warm golden hour with floating pollen
- **Effects:** Soft heat shimmer, orange tint, gentle bloom
- **Best for:** Nature scenes, peaceful moments

#### Storm
- **Atmosphere:** Heavy rain with lightning and wind
- **Effects:** Dark vignette, desaturated, periodic lightning flashes
- **Special:** Auto-triggering wind gusts and lightning
- **Best for:** Dramatic weather, tension

#### Underwater
- **Atmosphere:** Submerged view with rising bubbles
- **Effects:** Wavy refraction, blue tint
- **Best for:** Ocean scenes, aquariums

#### Haunted
- **Atmosphere:** Eerie fog with muted colors
- **Effects:** Heavy vignette, strong desaturation, subtle dream distortion
- **Best for:** Horror, abandoned locations

#### Magical
- **Atmosphere:** Enchanted forest with fireflies
- **Effects:** Soft bloom, gentle dream distortion, green tint
- **Best for:** Fantasy, enchanted locations

### Using Scenes

```typescript
// Apply a scene preset
renderer.setScene('storm');

// Scene automatically handles:
// - Particle preset and settings
// - Displacement effects
// - Color effects
// - Auto-triggering wind gusts (storm)
// - Auto-triggering lightning (storm)

// Clear scene and reset effects
renderer.clearScene();
```

---

## Configuration

All settings are in `packages/frontend/src/config.ts` under `WORLD_VIEW_3D_CONFIG`.

### Quick Start Examples

**Using scene presets (easiest):**
```typescript
// In your component
renderer.setScene('sunset');
renderer.setScene('storm');
renderer.setScene('underwater');
```

**Manual configuration:**
```typescript
PARTICLES: {
  ENABLED: true,
  PRESET: 'dust',
  DEPTH: 4,
},
POSTPROCESSOR: {
  ENABLED: true,
  PRESET: 'heatwave',
}
```

---

## Runtime API

The `WorldViewRenderer` exposes methods to change effects at runtime:

```typescript
// ===== Particles =====
renderer.setParticlePreset('snow');
renderer.setParticlesEnabled(true);
renderer.triggerWindGust(2, 0, 1.5);  // strengthX, strengthY, duration

// ===== Displacement Effects =====
renderer.setPostProcessorPreset('underwater');
renderer.setPostProcessorEnabled(true);
renderer.setPostProcessorIntensity(0.5);

// ===== Color Effects =====
renderer.setVignette(0.5);
renderer.setBloom(0.4);
renderer.setTint(1.2, 0.9, 0.7, 0.5);  // r, g, b, strength
renderer.setDesaturate(0.5);
renderer.triggerLightning(0.8);
renderer.setColorEffects({ vignette: 0.5, bloom: 0.3 });
renderer.resetColorEffects();

// ===== Scene Presets =====
renderer.setScene('sunset');   // sunset | storm | underwater | haunted | magical
renderer.clearScene();
```

---

## File Structure

```
effects/
├── README.md                    # This documentation
├── particles/
│   ├── index.ts                # Exports
│   ├── types.ts                # TypeScript interfaces
│   ├── presets.ts              # Preset configurations
│   └── ParticleSystem.ts       # Main particle class (includes wind gusts)
├── postprocessors/
│   ├── index.ts                # Exports
│   ├── types.ts                # TypeScript interfaces
│   ├── presets.ts              # Preset configurations
│   └── PostProcessorSystem.ts  # Displacement + color effects
└── scenes/
    ├── index.ts                # Exports
    ├── types.ts                # Scene preset interfaces
    └── presets.ts              # Scene configurations (sunset, storm, etc.)
