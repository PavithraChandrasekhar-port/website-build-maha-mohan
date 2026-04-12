// Simple gradient fragment shader
// Creates a smooth gradient effect

precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  
  // Create a gradient based on position and time
  vec3 color1 = vec3(0.2, 0.3, 0.8);
  vec3 color2 = vec3(0.8, 0.2, 0.5);
  
  float t = sin(u_time * 0.5) * 0.5 + 0.5;
  vec3 color = mix(color1, color2, uv.x + uv.y * 0.5 + t * 0.2);
  
  gl_FragColor = vec4(color, 1.0);
}

