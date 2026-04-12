// Progressive blur fragment shader
// Applies multi-tap blur effect with burgundy tint and Perlin noise texture
// Optimized for WebGL 1.0 compatibility

precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_blurIntensity; // 0.0 = no blur, 1.0 = max blur
uniform float u_blurRadius; // Blur radius multiplier (default: 20.0)
uniform float u_burgundyIntensity; // Burgundy tint strength (default: 0.32)
uniform float u_time;

varying vec2 v_texCoord;

// Hash function for Perlin noise
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Perlin noise function (smooth, continuous noise)
float perlinNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
  
  return mix(
    mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  ) * 0.5 + 0.5; // Normalize to 0-1
}

// Fractal Brownian Motion (fBm) - layered Perlin noise for more texture
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    value += amplitude * perlinNoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  vec2 uv = v_texCoord;
  vec2 texelSize = 1.0 / u_resolution;
  
  // Calculate blur radius based on intensity and radius multiplier
  float blurRadius = u_blurIntensity * u_blurRadius;
  
  // If no blur, just sample the texture directly
  if (blurRadius < 0.01) {
    gl_FragColor = texture2D(u_texture, uv);
    return;
  }
  
  // Apply multi-tap blur (9 samples in a cross pattern)
  vec4 color = vec4(0.0);
  float weight = 1.0 / 9.0;
  
  // Center sample
  color += texture2D(u_texture, uv) * weight;
  
  // Horizontal and vertical samples
  vec2 offset1 = vec2(blurRadius * texelSize.x, 0.0);
  vec2 offset2 = vec2(-blurRadius * texelSize.x, 0.0);
  vec2 offset3 = vec2(0.0, blurRadius * texelSize.y);
  vec2 offset4 = vec2(0.0, -blurRadius * texelSize.y);
  
  color += texture2D(u_texture, uv + offset1) * weight;
  color += texture2D(u_texture, uv + offset2) * weight;
  color += texture2D(u_texture, uv + offset3) * weight;
  color += texture2D(u_texture, uv + offset4) * weight;
  
  // Diagonal samples
  vec2 offset5 = vec2(blurRadius * texelSize.x * 0.7, blurRadius * texelSize.y * 0.7);
  vec2 offset6 = vec2(-blurRadius * texelSize.x * 0.7, blurRadius * texelSize.y * 0.7);
  vec2 offset7 = vec2(blurRadius * texelSize.x * 0.7, -blurRadius * texelSize.y * 0.7);
  vec2 offset8 = vec2(-blurRadius * texelSize.x * 0.7, -blurRadius * texelSize.y * 0.7);
  
  color += texture2D(u_texture, uv + offset5) * weight;
  color += texture2D(u_texture, uv + offset6) * weight;
  color += texture2D(u_texture, uv + offset7) * weight;
  color += texture2D(u_texture, uv + offset8) * weight;
  
  // Apply burgundy tint (#561D3C = RGB: 86/255, 29/255, 60/255)
  // Animate from center to edges (top and bottom) based on blur intensity
  if (u_blurIntensity > 0.1) {
    vec3 burgundyTint = vec3(0.337, 0.114, 0.235); // #561D3C normalized
    
    // Calculate distance from center (0.0 at center, 1.0 at edges)
    float centerY = 0.5;
    float distFromCenter = abs(uv.y - centerY) * 2.0; // 0.0 to 1.0
    
    // Reveal burgundy from center to edges as blur intensity increases
    // At blurIntensity 0.1: only center visible
    // At blurIntensity 1.0: full screen visible
    float revealProgress = (u_blurIntensity - 0.1) / 0.9; // Normalize to 0-1
    float edgeReveal = smoothstep(1.0 - revealProgress, 1.0, distFromCenter);
    
    // Base tint strength using uniform
    float baseTintStrength = u_blurIntensity * u_burgundyIntensity;
    // Edge reveal adds more tint at edges as we scroll
    float tintStrength = baseTintStrength + (edgeReveal * 0.22);
    
    color.rgb = mix(color.rgb, color.rgb * burgundyTint, tintStrength);
  }
  
  // Add Perlin noise texture overlay with multiple layers for richer texture
  if (u_blurIntensity > 0.1) {
    // Layer 1: Base Perlin noise with subtle animation
    vec2 noiseUV1 = uv * 3.0; // Scale for noise texture
    vec2 timeOffset1 = vec2(u_time * 0.02, u_time * 0.015); // Slow, subtle movement
    float noiseValue1 = perlinNoise(noiseUV1 + timeOffset1);
    
    // Layer 2: Finer detail noise for texture richness
    vec2 noiseUV2 = uv * 8.0; // Finer scale
    vec2 timeOffset2 = vec2(u_time * 0.03, u_time * -0.02); // Different direction
    float noiseValue2 = perlinNoise(noiseUV2 + timeOffset2);
    
    // Layer 3: Large scale texture variation
    vec2 noiseUV3 = uv * 1.5; // Larger scale
    float noiseValue3 = perlinNoise(noiseUV3);
    
    // Combine multiple noise layers for richer texture
    float combinedNoise = (noiseValue1 * 0.5 + noiseValue2 * 0.3 + noiseValue3 * 0.2);
    
    // Increased noise overlay for more visible texture
    float noiseStrength = u_blurIntensity * 0.22; // Increased for more texture
    color.rgb += (combinedNoise - 0.5) * noiseStrength;
  }
  
  gl_FragColor = color;
}

