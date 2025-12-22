import { useEffect, useRef, useCallback, memo } from 'react';
import { isWebGLSupported } from '@/utils/webgl/context';
import { createShaderProgram, getUniformLocations, getAttributeLocations } from '@/utils/webgl/shader';
import { disposeBuffer } from '@/utils/webgl/buffer';
import vertexShader from '@/shaders/vertex/passthrough.glsl?raw';
import backgroundShader from '@/shaders/fragment/exhibits-background.glsl?raw';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ExhibitsBackgroundProps {
  scrollProgress?: number; // 0.0 to 1.0
  intensity?: number; // 0.0 to 1.0
  className?: string;
  style?: React.CSSProperties;
}

function ExhibitsBackground({
  scrollProgress = 0,
  intensity = 1.0,
  className,
  style,
}: ExhibitsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const texCoordBufferRef = useRef<WebGLBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const positionLocationRef = useRef<number>(-1);
  const texCoordLocationRef = useRef<number>(-1);
  const prefersReducedMotion = useReducedMotion();

  const initWebGL = useCallback(() => {
    if (!canvasRef.current || !isWebGLSupported()) {
      return () => {};
    }

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
    }) as WebGLRenderingContext | null;

    if (!gl) {
      return () => {};
    }

    glRef.current = gl;

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvasRef.current || !glRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create shader program
    const program = createShaderProgram(gl, vertexShader, backgroundShader);
    if (!program) {
      console.error('Failed to create shader program');
      window.removeEventListener('resize', resizeCanvas);
      return () => {};
    }
    programRef.current = program;

    // Get uniform locations
    uniformsRef.current = getUniformLocations(gl, program, [
      'u_resolution',
      'u_time',
      'u_scrollProgress',
      'u_intensity',
    ]);

    // Get attribute locations
    const attributes = getAttributeLocations(gl, program, ['a_position', 'a_texCoord']);
    positionLocationRef.current = attributes.a_position;
    texCoordLocationRef.current = attributes.a_texCoord;

    // Create quad buffers
    const positionBuffer = gl.createBuffer();
    if (positionBuffer) {
      const positions = new Float32Array([
        -1, -1, // Bottom left
        1, -1,  // Bottom right
        -1, 1,  // Top left
        1, 1,   // Top right
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      positionBufferRef.current = positionBuffer;
    }

    const texCoordBuffer = gl.createBuffer();
    if (texCoordBuffer) {
      const texCoords = new Float32Array([
        0, 1, // Bottom left
        1, 1, // Bottom right
        0, 0, // Top left
        1, 0, // Top right
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      texCoordBufferRef.current = texCoordBuffer;
    }

    // Setup rendering state
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const render = useCallback(() => {
    if (!glRef.current || !programRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const gl = glRef.current;
    const program = programRef.current;

    // Check if program is still valid (not deleted)
    if (!gl.getProgramParameter(program, gl.DELETE_STATUS)) {
      // Program was deleted, stop rendering
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    gl.useProgram(program);

    // Set uniforms
    if (uniformsRef.current.u_resolution !== null) {
      gl.uniform2f(uniformsRef.current.u_resolution, gl.canvas.width, gl.canvas.height);
    }
    if (uniformsRef.current.u_time !== null) {
      // Disable time animation if reduced motion is preferred
      const time = prefersReducedMotion ? 0 : performance.now() * 0.001;
      gl.uniform1f(uniformsRef.current.u_time, time);
    }
    if (uniformsRef.current.u_scrollProgress !== null) {
      gl.uniform1f(uniformsRef.current.u_scrollProgress, scrollProgress);
    }
    if (uniformsRef.current.u_intensity !== null) {
      gl.uniform1f(uniformsRef.current.u_intensity, intensity);
    }

    // Bind position buffer
    if (positionBufferRef.current && positionLocationRef.current !== -1) {
      // Check if buffer is still valid
      if (gl.isBuffer(positionBufferRef.current)) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
        gl.enableVertexAttribArray(positionLocationRef.current);
        gl.vertexAttribPointer(positionLocationRef.current, 2, gl.FLOAT, false, 0, 0);
      } else {
        // Buffer was deleted, stop rendering
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
    }

    // Bind texture coordinates buffer
    if (texCoordBufferRef.current && texCoordLocationRef.current !== -1) {
      // Check if buffer is still valid
      if (gl.isBuffer(texCoordBufferRef.current)) {
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRef.current);
        gl.enableVertexAttribArray(texCoordLocationRef.current);
        gl.vertexAttribPointer(texCoordLocationRef.current, 2, gl.FLOAT, false, 0, 0);
      } else {
        // Buffer was deleted, stop rendering
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
    }

    // Draw
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Continue animation loop (only if not reduced motion)
    if (!prefersReducedMotion) {
      animationFrameRef.current = requestAnimationFrame(render);
    } else {
      animationFrameRef.current = null;
    }
  }, [scrollProgress, intensity, prefersReducedMotion]);

  // Initialize WebGL
  const isInitializedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const cleanup = initWebGL();
    cleanupRef.current = cleanup;
    isInitializedRef.current = true;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (glRef.current) {
        const gl = glRef.current;
        disposeBuffer(gl, positionBufferRef.current);
        disposeBuffer(gl, texCoordBufferRef.current);
        if (programRef.current) {
          gl.deleteProgram(programRef.current);
        }
      }

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [initWebGL]);

  // Start render loop
  useEffect(() => {
    if (glRef.current && programRef.current) {
      if (!animationFrameRef.current) {
        render();
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [render]);

  if (!isWebGLSupported()) {
    return null; // No fallback needed for background
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

export default memo(ExhibitsBackground);

