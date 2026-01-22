/**
 * WebGL Shaders for WorldView
 * Vertex and fragment shaders for depth-based parallax rendering
 */

import * as THREE from 'three';

export interface ShaderUniforms {
  [uniform: string]: THREE.IUniform<any>;
  map: { value: THREE.Texture };
  mouseDelta: { value: THREE.Vector2 };
  focus: { value: number };
  meshDepth: { value: number };
  sensitivity: { value: number };
  opacity: { value: number };
  // Model filter uniforms (for AI model color alignment)
  saturation: { value: number };
  contrast: { value: number };
  brightness: { value: number };
  gamma: { value: number };
}

/**
 * Create shader uniforms with default values
 */
export function createShaderUniforms(
  texture: THREE.Texture,
  focus: number,
  meshDepth: number
): ShaderUniforms {
  return {
    map: { value: texture },
    mouseDelta: { value: new THREE.Vector2(0, 0) },
    focus: { value: focus },
    meshDepth: { value: meshDepth },
    sensitivity: { value: 0.5 },
    opacity: { value: 1.0 },
    // Default model filters (no correction)
    saturation: { value: 1.0 },
    contrast: { value: 1.0 },
    brightness: { value: 1.0 },
    gamma: { value: 1.0 }
  };
}

/**
 * Vertex shader - tiefling's parallax approach
 * Handles depth-based displacement with edge preservation
 */
export function getVertexShader(): string {
  return `
    uniform vec2 mouseDelta;
    uniform float focus;
    uniform float meshDepth;
    uniform float sensitivity;
    
    attribute float depth;
    
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float actualDepth = depth * meshDepth;
      float focusDepth = focus * meshDepth;
      
      // Rotational displacement (relative to focus depth)
      // Objects at focus depth stay still, others shift based on mouse
      vec2 rotate = mouseDelta * sensitivity * 
          (1.0 - focus) * 
          (actualDepth - focusDepth) * 
          vec2(-1.0, 1.0);
      
      // Edge preservation - don't move vertices at image edges
      float edgeWidth = 0.02;
      vec2 edgeFactorVec = smoothstep(0.0, edgeWidth, vUv) * 
                          smoothstep(1.0, 1.0 - edgeWidth, vUv);
      float edgeFactor = edgeFactorVec.x * edgeFactorVec.y;
      
      // Apply displacement with edge preservation
      pos.xy += rotate * edgeFactor;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
}

/**
 * Fragment shader - texture sampling with color correction
 */
export function getFragmentShader(): string {
  return `
    uniform sampler2D map;
    uniform float opacity;
    uniform float saturation;
    uniform float contrast;
    uniform float brightness;
    uniform float gamma;
    
    varying vec2 vUv;

    // Convert RGB to HSL
    vec3 rgb2hsl(vec3 color) {
      float maxC = max(max(color.r, color.g), color.b);
      float minC = min(min(color.r, color.g), color.b);
      float delta = maxC - minC;
      
      float h = 0.0;
      float s = 0.0;
      float l = (maxC + minC) / 2.0;
      
      if (delta > 0.0) {
        s = l < 0.5 ? delta / (maxC + minC) : delta / (2.0 - maxC - minC);
        
        if (maxC == color.r) {
          h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
        } else if (maxC == color.g) {
          h = (color.b - color.r) / delta + 2.0;
        } else {
          h = (color.r - color.g) / delta + 4.0;
        }
        h /= 6.0;
      }
      
      return vec3(h, s, l);
    }

    // Convert HSL to RGB
    vec3 hsl2rgb(vec3 hsl) {
      float h = hsl.x;
      float s = hsl.y;
      float l = hsl.z;
      
      float c = (1.0 - abs(2.0 * l - 1.0)) * s;
      float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
      float m = l - c / 2.0;
      
      vec3 rgb;
      if (h < 1.0/6.0) {
        rgb = vec3(c, x, 0.0);
      } else if (h < 2.0/6.0) {
        rgb = vec3(x, c, 0.0);
      } else if (h < 3.0/6.0) {
        rgb = vec3(0.0, c, x);
      } else if (h < 4.0/6.0) {
        rgb = vec3(0.0, x, c);
      } else if (h < 5.0/6.0) {
        rgb = vec3(x, 0.0, c);
      } else {
        rgb = vec3(c, 0.0, x);
      }
      
      return rgb + m;
    }

    // Apply saturation adjustment
    vec3 applySaturation(vec3 color, float sat) {
      vec3 hsl = rgb2hsl(color);
      hsl.y *= sat;
      return hsl2rgb(hsl);
    }

    // Apply contrast adjustment
    vec3 applyContrast(vec3 color, float cont) {
      return (color - 0.5) * cont + 0.5;
    }

    // Apply brightness adjustment
    vec3 applyBrightness(vec3 color, float bright) {
      return color * bright;
    }

    // Apply gamma correction
    vec3 applyGamma(vec3 color, float g) {
      return pow(color, vec3(1.0 / g));
    }

    void main() {
      vec4 texColor = texture2D(map, vUv);
      vec3 color = texColor.rgb;
      
      // Apply model-specific color corrections in order
      color = applyContrast(color, contrast);
      color = applySaturation(color, saturation);
      color = applyBrightness(color, brightness);
      color = applyGamma(color, gamma);
      
      gl_FragColor = vec4(color, texColor.a * opacity);
    }
  `;
}

/**
 * Create shader material with depth uniforms
 */
export function createDepthShaderMaterial(
  texture: THREE.Texture,
  focus: number,
  meshDepth: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: createShaderUniforms(texture, focus, meshDepth),
    vertexShader: getVertexShader(),
    fragmentShader: getFragmentShader(),
    side: THREE.DoubleSide
  });
}
