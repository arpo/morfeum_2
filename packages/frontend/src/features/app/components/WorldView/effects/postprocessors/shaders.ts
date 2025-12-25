/**
 * Post-Processor Shaders
 * GLSL shaders for displacement and color effects
 */

// Vertex shader - simple pass-through
export const postProcessorVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader - displacement + color effects
export const postProcessorFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float time;
  uniform float intensity;
  uniform float frequency;
  uniform vec2 direction;
  uniform int effectType;  // 0=heatwave, 1=underwater, 2=glitch, 3=dream
  
  // Color effects uniforms
  uniform float vignette;      // 0-1 vignette strength
  uniform vec3 tint;           // RGB tint color (1,1,1 = no tint)
  uniform float tintStrength;  // 0-1 tint blend
  uniform float bloom;         // 0-1 bloom strength
  uniform float lightning;     // 0-1 lightning flash
  uniform float desaturate;    // 0-1 desaturation amount
  
  varying vec2 vUv;
  
  // Simplex noise for organic distortion
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  // Heat wave effect - rising shimmer
  vec2 heatWaveDisplacement(vec2 uv) {
    float noise1 = snoise(vec2(uv.x * frequency * 2.0, uv.y * frequency - time * 0.5));
    float noise2 = snoise(vec2(uv.x * frequency * 3.0 + 100.0, uv.y * frequency * 0.5 - time * 0.3));
    
    // Stronger at bottom, weaker at top (heat rises)
    float heightFactor = 1.0 - uv.y;
    
    vec2 displacement;
    displacement.x = noise1 * intensity * 0.02 * heightFactor;
    displacement.y = noise2 * intensity * 0.01 * heightFactor;
    
    return displacement;
  }
  
  // Underwater effect - wavy refraction
  vec2 underwaterDisplacement(vec2 uv) {
    float wave1 = sin(uv.x * frequency * 10.0 + time) * cos(uv.y * frequency * 8.0 + time * 0.7);
    float wave2 = sin(uv.y * frequency * 12.0 - time * 0.8) * cos(uv.x * frequency * 6.0 + time * 0.5);
    float noise = snoise(vec2(uv.x * frequency + time * 0.2, uv.y * frequency + time * 0.15));
    
    vec2 displacement;
    displacement.x = (wave1 + noise * 0.5) * intensity * 0.015;
    displacement.y = (wave2 + noise * 0.3) * intensity * 0.015;
    
    return displacement;
  }
  
  // Glitch effect - digital corruption with scan lines
  vec2 glitchDisplacement(vec2 uv) {
    // Create horizontal glitch bands
    float bandNoise = snoise(vec2(floor(time * 8.0), floor(uv.y * 15.0)));
    float glitchBand = step(0.6, abs(bandNoise));  // More frequent bands
    
    // Random horizontal offset per band
    float offset = snoise(vec2(floor(time * 15.0), floor(uv.y * 10.0)));
    
    // Add occasional strong glitches
    float strongGlitch = step(0.85, snoise(vec2(time * 5.0, 0.0))) * 2.0;
    
    // Chromatic aberration-like split
    float split = sin(uv.y * 50.0 + time * 10.0) * 0.3;
    
    vec2 displacement;
    displacement.x = (offset * glitchBand + split * glitchBand * 0.5 + strongGlitch * offset) * intensity * 0.08;
    displacement.y = glitchBand * snoise(vec2(time * 12.0, uv.x * 20.0)) * intensity * 0.02;
    
    return displacement;
  }
  
  // Dream effect - soft wavy distortion with breathing
  vec2 dreamDisplacement(vec2 uv) {
    // Slow breathing pulse
    float pulse = sin(time * 0.8) * 0.5 + 0.5;
    float pulse2 = sin(time * 0.5 + 1.5) * 0.5 + 0.5;
    
    // Layered wave distortion
    float wave1 = sin(uv.x * frequency * 4.0 + time * 0.5) * cos(uv.y * frequency * 3.0 + time * 0.3);
    float wave2 = sin(uv.y * frequency * 5.0 - time * 0.4) * cos(uv.x * frequency * 2.0 + time * 0.6);
    float noise = snoise(vec2(uv.x * frequency + time * 0.15, uv.y * frequency + time * 0.1));
    
    // Radial soft vignette effect
    float radial = length(uv - 0.5);
    float vignette = 1.0 - radial * 0.5;
    
    vec2 displacement;
    displacement.x = (wave1 * pulse + noise * 0.5 * pulse2) * vignette * intensity * 0.04;
    displacement.y = (wave2 * pulse2 + noise * 0.3 * pulse) * vignette * intensity * 0.04;
    
    return displacement;
  }
  
  // Apply vignette effect
  vec3 applyVignette(vec3 color, vec2 uv, float strength) {
    float dist = length(uv - 0.5) * 2.0;
    float vig = 1.0 - smoothstep(0.5, 1.5, dist) * strength;
    return color * vig;
  }
  
  // Apply color tint
  vec3 applyTint(vec3 color, vec3 tintColor, float strength) {
    return mix(color, color * tintColor, strength);
  }
  
  // Apply bloom (fake bloom - brighten bright areas)
  vec3 applyBloom(vec3 color, float strength) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    float bloomFactor = smoothstep(0.5, 1.0, luminance) * strength;
    return color + color * bloomFactor * 1.5;
  }
  
  // Apply lightning flash
  vec3 applyLightning(vec3 color, float strength) {
    return color + vec3(strength);
  }
  
  // Apply desaturation
  vec3 applyDesaturate(vec3 color, float strength) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(gray), strength);
  }
  
  void main() {
    vec2 displacement = vec2(0.0);
    
    if (effectType == 0) {
      displacement = heatWaveDisplacement(vUv);
    } else if (effectType == 1) {
      displacement = underwaterDisplacement(vUv);
    } else if (effectType == 2) {
      displacement = glitchDisplacement(vUv);
    } else if (effectType == 3) {
      displacement = dreamDisplacement(vUv);
    }
    
    vec2 distortedUv = vUv + displacement * direction;
    
    // Clamp UV to prevent sampling outside texture
    distortedUv = clamp(distortedUv, 0.0, 1.0);
    
    vec3 color = texture2D(tDiffuse, distortedUv).rgb;
    
    // Apply color effects in order
    if (desaturate > 0.0) {
      color = applyDesaturate(color, desaturate);
    }
    if (tintStrength > 0.0) {
      color = applyTint(color, tint, tintStrength);
    }
    if (bloom > 0.0) {
      color = applyBloom(color, bloom);
    }
    if (vignette > 0.0) {
      color = applyVignette(color, vUv, vignette);
    }
    if (lightning > 0.0) {
      color = applyLightning(color, lightning);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Map effect type to shader int
export const EFFECT_TYPE_MAP: Record<string, number> = {
  heatwave: 0,
  underwater: 1,
  glitch: 2,
  dream: 3,
};
