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
    sensitivity: { value: 0.5 }
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
 * Fragment shader - simple texture sampling
 */
export function getFragmentShader(): string {
  return `
    uniform sampler2D map;
    varying vec2 vUv;

    void main() {
      gl_FragColor = texture2D(map, vUv);
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
