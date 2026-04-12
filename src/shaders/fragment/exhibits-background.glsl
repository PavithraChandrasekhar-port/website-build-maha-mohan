// Exhibits background shader
// Animated gradient or noise pattern with subtle parallax
// Optimized for WebGL 1.0 compatibility

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scrollProgress; // 0.0 to 1.0
uniform float u_intensity; // Effect intensity (0.0 to 1.0)

varying vec2 v_texCoord;

// Hash function for Perlin noise
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Perlin noise function
float perlinNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  ) * 0.5 + 0.5;
}

void main() {
  vec2 uv = v_texCoord;
  
  // Subtle parallax based on scroll
  vec2 parallaxOffset = vec2(u_scrollProgress * 0.1, 0.0);
  uv += parallaxOffset;
  
  // Animated Perlin noise pattern
  vec2 noiseUV = uv * 2.0;
  vec2 timeOffset = vec2(u_time * 0.05, u_time * 0.03);
  float noise = perlinNoise(noiseUV + timeOffset);
  
  // Create subtle gradient from dark to slightly lighter
  float gradient = mix(0.1, 0.15, uv.y); // Very subtle gradient
  
  // Combine noise with gradient
  float value = gradient + (noise - 0.5) * 0.1 * u_intensity;
  
  // Apply burgundy tint (#561D3C)
  vec3 burgundy = vec3(0.337, 0.114, 0.235);
  vec3 color = mix(vec3(value), burgundy * value, 0.3 * u_intensity);
  
  gl_FragColor = vec4(color, u_intensity * 0.3); // Low opacity to not distract
}

