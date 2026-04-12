// Exhibit image shader with scroll-based effects
// Applies subtle displacement, noise overlay, and color grading
// Optimized for WebGL 1.0 compatibility

precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scrollProgress; // 0.0 to 1.0
uniform float u_intensity; // Effect intensity (0.0 to 1.0)

varying vec2 v_texCoord;

// Hash function for Perlin noise (reused from blur shader)
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
  
  // Scroll-based displacement for depth effect
  float displacement = sin(u_time * 0.5 + u_scrollProgress * 3.14159) * 0.01 * u_intensity;
  uv += vec2(displacement, displacement * 0.5);
  
  // Sample the texture
  vec4 color = texture2D(u_texture, uv);
  
  // Add subtle noise overlay for texture
  if (u_intensity > 0.1) {
    vec2 noiseUV = uv * 4.0;
    float noiseValue = perlinNoise(noiseUV + vec2(u_time * 0.1));
    float noiseStrength = u_intensity * 0.08; // Subtle noise
    color.rgb += (noiseValue - 0.5) * noiseStrength;
  }
  
  // Subtle burgundy color grading to match theme
  if (u_intensity > 0.2) {
    vec3 burgundyTint = vec3(0.337, 0.114, 0.235); // #561D3C
    float tintStrength = (u_intensity - 0.2) * 0.15; // Very subtle tint
    color.rgb = mix(color.rgb, color.rgb * burgundyTint, tintStrength);
  }
  
  gl_FragColor = color;
}

