// Noise-based fragment shader
// Creates animated noise patterns

precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

varying vec2 v_texCoord;

// Simple noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = v_texCoord * 5.0;
  uv += u_time * 0.1;
  
  float n = noise(uv);
  vec3 color = vec3(n);
  
  // Add some color variation
  color = mix(vec3(0.1, 0.2, 0.4), vec3(0.8, 0.6, 0.4), n);
  
  gl_FragColor = vec4(color, 1.0);
}

