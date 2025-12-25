/**
 * Particle System Shaders
 * GLSL shaders for soft circular particles
 */

import * as THREE from 'three';
import type { ParticleBlendMode } from './types';

// Map blend mode string to Three.js blending constant
export const BLEND_MODES: Record<ParticleBlendMode, THREE.Blending> = {
  normal: THREE.NormalBlending,
  additive: THREE.AdditiveBlending,
  multiply: THREE.MultiplyBlending,
};

// Vertex shader - passes size and opacity to fragment shader
export const particleVertexShader = `
  attribute float size;
  attribute float opacity;
  varying float vOpacity;
  
  void main() {
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader - creates soft circular particles with fading edges
export const particleFragmentShader = `
  uniform vec3 color;
  varying float vOpacity;
  
  void main() {
    // Calculate distance from center (gl_PointCoord is 0-1 for the point)
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    // Discard pixels outside the circle
    if (dist > 0.5) discard;
    
    // Soft edge falloff - smoothstep creates gradient from center to edge
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Apply particle opacity
    gl_FragColor = vec4(color, alpha * vOpacity);
  }
`;
