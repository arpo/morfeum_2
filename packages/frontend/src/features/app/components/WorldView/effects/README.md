# WorldView Effects System

This document describes the particle and post-processor effects available in the WorldView component.

## Table of Contents
- [Particle System](#particle-system)
- [Post-Processor System](#post-processor-system)
- [Configuration](#configuration)

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

### Preset Configuration Properties

Each preset defines these properties:

| Property | Type | Description |
|----------|------|-------------|
| `count` | number | Number of particles (50-500 typical) |
| `size` | `{min, max}` | Particle size range |
| `speed` | `{min, max}` | Movement speed range |
| `opacity` | `{min, max}` | Transparency range (0-1) |
| `color` | string | Hex color (e.g., '#ffffff') |
| `behavior` | string | Movement type: 'float', 'fall', 'rise', 'flicker' |
| `blendMode` | string | 'normal', 'additive' (glow), 'multiply' |
| `wind` | `{x, y}` | Constant wind force |
| `drift` | `{x, y}` | Directional drift |
| `turbulence` | number | Random movement intensity (0-1) |
| `depthAware` | boolean | Whether particles respect depth |

### Behaviors

- **float** — Gentle drifting with turbulence (dust, pollen)
- **fall** — Gravity-affected falling, resets at bottom (snow, rain, ash)
- **rise** — Upward movement, resets at top (embers, sparks, bubbles)
- **flicker** — Slow random movement with opacity pulsing (fireflies, stars)

---

## Post-Processor System

The post-processor applies full-screen image displacement effects like heat wave distortion, underwater refraction, glitch effects, and dream-like warping.

### Post-Processor Configuration (in `config.ts`)

```typescript
POSTPROCESSOR: {
  ENABLED: false,     // Enable/disable post-processing
  PRESET: 'heatwave', // Which effect to use
}
```

### Settings Explained

| Setting | Type | Description |
|---------|------|-------------|
| `ENABLED` | boolean | Turn post-processing on/off |
| `PRESET` | string | Name of the effect preset to use |

### Available Presets

| Preset | Description | Visual Effect |
|--------|-------------|---------------|
| `heatwave` | Rising shimmer like heat from hot surface | Vertical wavy distortion, stronger at bottom |
| `underwater` | Wavy refraction like light through water | Multi-directional wave displacement |
| `glitch` | Digital corruption effect | Horizontal bands, scan lines, chromatic split |
| `dream` | Soft pulsing distortion | Breathing waves, organic movement |

### Preset Configuration Properties

Each preset defines these properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | — | Effect type: 'heatwave', 'underwater', 'glitch', 'dream' |
| `intensity` | number | 0.3-0.6 | Effect strength (0-1) |
| `speed` | number | 0.5-1.5 | Animation speed multiplier |
| `frequency` | number | 1-3 | Wave frequency (higher = more waves) |
| `direction` | `{x, y}` | `{1, 1}` | Displacement direction multiplier |

### Effect Details

#### Heatwave
- Rising shimmer effect like heat from a hot surface
- Stronger distortion at the bottom of the screen
- Uses noise-based displacement
- Best for: Desert scenes, hot environments, forges

#### Underwater  
- Wavy refraction like looking through water
- Combined sine waves and noise
- Uniform across the screen
- Best for: Underwater scenes, aquariums, liquid views

#### Glitch
- Digital corruption with horizontal bands
- Occasional strong glitch bursts
- Chromatic aberration-like splitting
- Scan line effects
- Best for: Cyberpunk, tech failure, horror

#### Dream
- Soft pulsing distortion with breathing rhythm
- Layered wave interference
- Vignette falloff toward edges
- Best for: Flashbacks, surreal scenes, meditation

---

## Configuration

All settings are in `packages/frontend/src/config.ts` under `WORLD_VIEW_3D_CONFIG`.

### Quick Start Examples

**Dusty atmosphere:**
```typescript
PARTICLES: {
  ENABLED: true,
  PRESET: 'dust',
  DEPTH: 4,
}
```

**Snowy scene:**
```typescript
PARTICLES: {
  ENABLED: true,
  PRESET: 'snow',
  DEPTH: 3,
}
```

**Underwater scene:**
```typescript
PARTICLES: {
  ENABLED: true,
  PRESET: 'bubbles',
  DEPTH: 5,
},
POSTPROCESSOR: {
  ENABLED: true,
  PRESET: 'underwater',
}
```

**Campfire scene:**
```typescript
PARTICLES: {
  ENABLED: true,
  PRESET: 'embers',
  DEPTH: 4,
},
POSTPROCESSOR: {
  ENABLED: true,
  PRESET: 'heatwave',
}
```

**Cyberpunk glitch:**
```typescript
PARTICLES: {
  ENABLED: true,
  PRESET: 'sparks',
  DEPTH: 3,
},
POSTPROCESSOR: {
  ENABLED: true,
  PRESET: 'glitch',
}
```

---

## Runtime API

The `WorldViewRenderer` exposes methods to change effects at runtime:

```typescript
// Particles
renderer.setParticlePreset('snow');
renderer.setParticlesEnabled(true);

// Post-processor
renderer.setPostProcessorPreset('underwater');
renderer.setPostProcessorEnabled(true);
renderer.setPostProcessorIntensity(0.5);
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
│   └── ParticleSystem.ts       # Main particle class
└── postprocessors/
    ├── index.ts                # Exports
    ├── types.ts                # TypeScript interfaces
    ├── presets.ts              # Preset configurations
    └── PostProcessorSystem.ts  # Main post-processor class
