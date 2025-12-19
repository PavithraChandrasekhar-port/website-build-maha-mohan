export interface ShaderProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
  attributes: Record<string, number>;
}

export interface ShaderConfig {
  vertexShader: string;
  fragmentShader: string;
  uniforms?: Record<string, UniformType>;
  attributes?: Record<string, number>;
}

export type UniformType = 
  | '1f' | '2f' | '3f' | '4f'
  | '1i' | '2i' | '3i' | '4i'
  | '1fv' | '2fv' | '3fv' | '4fv'
  | '1iv' | '2iv' | '3iv' | '4iv'
  | 'matrix2fv' | 'matrix3fv' | 'matrix4fv'
  | 'sampler2D';

export interface UniformValue {
  type: UniformType;
  value: number | number[] | Float32Array | WebGLTexture;
}

export interface WebGLContextState {
  gl: WebGLRenderingContext | null;
  canvas: HTMLCanvasElement | null;
  isInitialized: boolean;
  error: string | null;
}

