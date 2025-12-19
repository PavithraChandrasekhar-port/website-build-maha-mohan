/**
 * WebGL Context Utilities
 * Handles WebGL context initialization, context loss/restore, and cleanup
 */

export function createWebGLContext(
  canvas: HTMLCanvasElement,
  options?: WebGLContextAttributes
): WebGLRenderingContext | null {
  const defaultOptions: WebGLContextAttributes = {
    alpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    ...options,
  };

  const gl = (canvas.getContext('webgl', defaultOptions) || 
             canvas.getContext('experimental-webgl', defaultOptions)) as WebGLRenderingContext | null;

  if (!gl) {
    console.error('WebGL is not supported in this browser');
    return null;
  }

  return gl;
}

export function setCanvasSize(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  width?: number,
  height?: number
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
  const displayWidth = width || canvas.clientWidth;
  const displayHeight = height || canvas.clientHeight;

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}

export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

