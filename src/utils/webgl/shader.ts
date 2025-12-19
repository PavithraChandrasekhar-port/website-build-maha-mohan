/**
 * WebGL Shader Compilation Utilities
 * Handles loading, compiling, and linking shaders
 */

export async function loadShader(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader: ${url}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading shader from ${url}:`, error);
    throw error;
  }
}

export function compileShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Failed to create shader');
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    console.error(`Shader compilation error: ${error}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function createShaderProgram(
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    console.error('Failed to create shader program');
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    console.error(`Shader program linking error: ${error}`);
    gl.deleteProgram(program);
    return null;
  }

  // Clean up shaders after linking
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

export function getUniformLocations(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  uniformNames: string[]
): Record<string, WebGLUniformLocation | null> {
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  
  for (const name of uniformNames) {
    const location = gl.getUniformLocation(program, name);
    uniforms[name] = location;
    if (location === null) {
      console.warn(`Uniform "${name}" not found in shader program`);
    }
  }
  
  return uniforms;
}

export function getAttributeLocations(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  attributeNames: string[]
): Record<string, number> {
  const attributes: Record<string, number> = {};
  
  for (const name of attributeNames) {
    const location = gl.getAttribLocation(program, name);
    attributes[name] = location;
    if (location === -1) {
      console.warn(`Attribute "${name}" not found in shader program`);
    }
  }
  
  return attributes;
}

