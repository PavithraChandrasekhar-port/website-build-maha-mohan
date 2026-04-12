// Perlin Noise Transition Shader
// Based on gl-transitions.com/editor/perlin
// Smoothly transitions between two textures using Perlin noise
// Radial transition: starts from center and spreads outward

precision mediump float;

uniform sampler2D u_fromTexture;
uniform sampler2D u_toTexture;
uniform float u_progress; // 0.0 to 1.0
uniform vec2 u_resolution;
uniform float u_smoothness; // Controls transition smoothness (default: 0.5)
uniform vec2 u_center; // Center point for radial transition (normalized 0-1)

varying vec2 v_texCoord;

// Hash function for Perlin noise
vec4 hash4(vec2 p) {
  return fract(sin(vec4(1.0 + dot(p, vec2(37.0, 17.0)),
                        2.0 + dot(p, vec2(11.0, 47.0)),
                        3.0 + dot(p, vec2(41.0, 29.0)),
                        4.0 + dot(p, vec2(23.0, 31.0)))) * 103.0);
}

// Perlin noise function
float perlinNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float n = mix(mix(dot(hash4(i + vec2(0.0, 0.0)).xy, f - vec2(0.0, 0.0)),
                    dot(hash4(i + vec2(1.0, 0.0)).xy, f - vec2(1.0, 0.0)), f.x),
                mix(dot(hash4(i + vec2(0.0, 1.0)).xy, f - vec2(0.0, 1.0)),
                    dot(hash4(i + vec2(1.0, 1.0)).xy, f - vec2(1.0, 1.0)), f.x), f.y);
  
  return n;
}

// Fractal Brownian Motion for smoother noise
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 4; i++) {
    value += amplitude * perlinNoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  vec2 uv = v_texCoord;
  
  // Calculate distance from center (normalized)
  vec2 center = u_center;
  vec2 toCenter = uv - center;
  float distFromCenter = length(toCenter);
  
  // Maximum distance (corner to center)
  float maxDist = length(vec2(0.5, 0.5));
  
  // Normalize distance (0 at center, 1 at corners)
  float normalizedDist = distFromCenter / maxDist;
  
  // Scale the noise based on resolution for consistent appearance
  vec2 noiseCoord = uv * 8.0;
  
  // Generate Perlin noise
  float noise = fbm(noiseCoord);
  
  // Combine radial distance with noise for organic spread
  // Progress starts from center (0) and spreads outward (1)
  // Add noise to create organic pattern
  float radialProgress = normalizedDist * u_progress;
  float noiseOffset = (noise - 0.5) * 0.3; // Noise variation
  float combinedProgress = radialProgress + noiseOffset;
  
  // Create transition mask - starts from center, spreads outward with noise
  float mask = smoothstep(combinedProgress - u_smoothness, combinedProgress + u_smoothness, u_progress);
  
  // Sample both textures
  vec4 fromColor = texture2D(u_fromTexture, uv);
  vec4 toColor = texture2D(u_toTexture, uv);
  
  // Mix between the two textures based on the noise mask
  vec4 color = mix(fromColor, toColor, mask);
  
  gl_FragColor = color;
}

