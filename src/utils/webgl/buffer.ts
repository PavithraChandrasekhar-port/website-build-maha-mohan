/**
 * WebGL Buffer Utilities
 * Common buffer creation and management
 */

export function createQuadBuffer(gl: WebGLRenderingContext): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) return null;

  // Full-screen quad vertices (x, y)
  const vertices = new Float32Array([
    -1, -1,  // Bottom left
     1, -1,  // Bottom right
    -1,  1,  // Top left
     1,  1,  // Top right
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  return buffer;
}

export function createTexture(
  gl: WebGLRenderingContext,
  image?: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set default texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  if (image) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  return texture;
}

export function disposeTexture(gl: WebGLRenderingContext, texture: WebGLTexture | null): void {
  if (texture) {
    gl.deleteTexture(texture);
  }
}

export function disposeBuffer(gl: WebGLRenderingContext, buffer: WebGLBuffer | null): void {
  if (buffer) {
    gl.deleteBuffer(buffer);
  }
}

export function disposeProgram(gl: WebGLRenderingContext, program: WebGLProgram | null): void {
  if (program) {
    gl.deleteProgram(program);
  }
}

