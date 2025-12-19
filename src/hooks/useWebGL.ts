import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebGLContextState } from '@/types/webgl';
import { createWebGLContext, setCanvasSize, isWebGLSupported } from '@/utils/webgl/context';
import { createShaderProgram, getUniformLocations, getAttributeLocations } from '@/utils/webgl/shader';
import { disposeProgram } from '@/utils/webgl/buffer';

interface UseWebGLOptions {
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: string[];
  attributes?: string[];
  onFrame?: (gl: WebGLRenderingContext, program: WebGLProgram, uniforms: Record<string, WebGLUniformLocation | null>) => void;
  autoResize?: boolean;
}

export function useWebGL(options: UseWebGLOptions = {}) {
  const {
    vertexShader,
    fragmentShader,
    uniforms = [],
    attributes = [],
    onFrame,
    autoResize = true,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const attributesRef = useRef<Record<string, number>>({});
  const animationFrameRef = useRef<number | null>(null);
  const [state, setState] = useState<WebGLContextState>({
    gl: null,
    canvas: null,
    isInitialized: false,
    error: null,
  });

  const initWebGL = useCallback(() => {
    if (!canvasRef.current) return;

    if (!isWebGLSupported()) {
      setState(prev => ({
        ...prev,
        error: 'WebGL is not supported in this browser',
      }));
      return;
    }

    const gl = createWebGLContext(canvasRef.current);
    if (!gl) {
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebGL context',
      }));
      return;
    }

    glRef.current = gl;

    if (autoResize) {
      setCanvasSize(canvasRef.current, gl);
    }

    setState({
      gl,
      canvas: canvasRef.current,
      isInitialized: true,
      error: null,
    });
  }, [autoResize]);

  const compileProgram = useCallback(() => {
    if (!glRef.current || !vertexShader || !fragmentShader) return;

    const program = createShaderProgram(glRef.current, vertexShader, fragmentShader);
    if (!program) {
      setState(prev => ({
        ...prev,
        error: 'Failed to compile shader program',
      }));
      return;
    }

    programRef.current = program;
    uniformsRef.current = getUniformLocations(glRef.current, program, uniforms);
    attributesRef.current = getAttributeLocations(glRef.current, program, attributes);
  }, [vertexShader, fragmentShader, uniforms, attributes]);

  const render = useCallback(() => {
    if (!glRef.current || !programRef.current || !onFrame) return;

    const gl = glRef.current;
    const program = programRef.current;

    gl.useProgram(program);
    onFrame(gl, program, uniformsRef.current);

    animationFrameRef.current = requestAnimationFrame(render);
  }, [onFrame]);

  useEffect(() => {
    initWebGL();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (glRef.current && programRef.current) {
        disposeProgram(glRef.current, programRef.current);
      }
    };
  }, [initWebGL]);

  useEffect(() => {
    if (state.isInitialized && vertexShader && fragmentShader) {
      compileProgram();
    }
  }, [state.isInitialized, vertexShader, fragmentShader, compileProgram]);

  useEffect(() => {
    if (state.isInitialized && programRef.current && onFrame) {
      render();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.isInitialized, onFrame, render]);

  useEffect(() => {
    if (!autoResize || !canvasRef.current || !glRef.current) return;

    const handleResize = () => {
      if (canvasRef.current && glRef.current) {
        setCanvasSize(canvasRef.current, glRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoResize]);

  return {
    canvasRef,
    gl: state.gl,
    program: programRef.current,
    uniforms: uniformsRef.current,
    attributes: attributesRef.current,
    isInitialized: state.isInitialized,
    error: state.error,
  };
}

