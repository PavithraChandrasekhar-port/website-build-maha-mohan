import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createTexture, disposeTexture, disposeBuffer } from '@/utils/webgl/buffer';
import { isWebGLSupported } from '@/utils/webgl/context';
import { createShaderProgram } from '@/utils/webgl/shader';
import vertexShader from '@/shaders/vertex/passthrough.glsl?raw';
import transitionShader from '@/shaders/fragment/perlin-transition.glsl?raw';

interface TransitionOverlayProps {
  fromImage: HTMLImageElement | null;
  toImage: HTMLImageElement | null;
  progress: number; // 0.0 to 1.0
  onComplete?: () => void;
  duration?: number; // Transition duration in milliseconds
  smoothness?: number; // Transition smoothness (0.0 to 1.0, default: 0.5)
  centerX?: number; // Center X for radial transition (in pixels)
  centerY?: number; // Center Y for radial transition (in pixels)
  className?: string;
  style?: React.CSSProperties;
}

function TransitionOverlay({
  fromImage,
  toImage,
  progress: externalProgress,
  onComplete,
  duration = 1000,
  smoothness = 0.5,
  centerX,
  centerY,
  className,
  style,
}: TransitionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fromTextureRef = useRef<WebGLTexture | null>(null);
  const toTextureRef = useRef<WebGLTexture | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const texCoordBufferRef = useRef<WebGLBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const positionLocationRef = useRef<number>(-1);
  const texCoordLocationRef = useRef<number>(-1);
  const isInitializedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [internalProgress, setInternalProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const initWebGL = useCallback(() => {
    if (!canvasRef.current || !isWebGLSupported()) {
      return () => {};
    }

    const canvas = canvasRef.current;
    
    if (glRef.current) {
      return () => {};
    }
    
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null;

    if (!gl) {
      return () => {};
    }

    glRef.current = gl;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create shader program
    const program = createShaderProgram(gl, vertexShader, transitionShader);
    if (!program) {
      console.error('❌ Shader compilation failed');
      // Try to get more details
      const vertexShaderObj = gl.createShader(gl.VERTEX_SHADER);
      if (vertexShaderObj) {
        gl.shaderSource(vertexShaderObj, vertexShader);
        gl.compileShader(vertexShaderObj);
        if (!gl.getShaderParameter(vertexShaderObj, gl.COMPILE_STATUS)) {
          console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShaderObj));
        }
        gl.deleteShader(vertexShaderObj);
      }
      const fragShaderObj = gl.createShader(gl.FRAGMENT_SHADER);
      if (fragShaderObj) {
        gl.shaderSource(fragShaderObj, transitionShader);
        gl.compileShader(fragShaderObj);
        if (!gl.getShaderParameter(fragShaderObj, gl.COMPILE_STATUS)) {
          console.error('Fragment shader error:', gl.getShaderInfoLog(fragShaderObj));
        }
        gl.deleteShader(fragShaderObj);
      }
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }

    programRef.current = program;
    gl.useProgram(program);

    // Get uniform locations
    uniformsRef.current = {
      u_fromTexture: gl.getUniformLocation(program, 'u_fromTexture'),
      u_toTexture: gl.getUniformLocation(program, 'u_toTexture'),
      u_progress: gl.getUniformLocation(program, 'u_progress'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_smoothness: gl.getUniformLocation(program, 'u_smoothness'),
      u_center: gl.getUniformLocation(program, 'u_center'),
    };
    
    // Check for missing uniforms
    const missingUniforms = Object.entries(uniformsRef.current)
      .filter(([_, location]) => location === null)
      .map(([name]) => name);
    if (missingUniforms.length > 0) {
      console.warn('⚠️ Missing uniforms:', missingUniforms);
    }

    // Get attribute locations
    positionLocationRef.current = gl.getAttribLocation(program, 'a_position');
    texCoordLocationRef.current = gl.getAttribLocation(program, 'a_texCoord');
    
    if (positionLocationRef.current === -1 || texCoordLocationRef.current === -1) {
      console.error('❌ Missing attributes');
    }

    // Create position buffer (full-screen quad)
    positionBufferRef.current = gl.createBuffer();
    if (positionBufferRef.current) {
      const positions = new Float32Array([
        -1, -1, // Bottom left
         1, -1, // Bottom right
        -1,  1, // Top left
         1,  1, // Top right
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }

    // Create texture coordinates buffer
    texCoordBufferRef.current = gl.createBuffer();
    if (texCoordBufferRef.current) {
      const texCoords = new Float32Array([
        0, 1, // Bottom left
        1, 1, // Bottom right
        0, 0, // Top left
        1, 0, // Top right
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    }

    // Create textures
    fromTextureRef.current = createTexture(gl);
    toTextureRef.current = createTexture(gl);

    // Setup rendering state
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (glRef.current) {
        disposeTexture(glRef.current, fromTextureRef.current);
        disposeTexture(glRef.current, toTextureRef.current);
        disposeBuffer(glRef.current, positionBufferRef.current);
        disposeBuffer(glRef.current, texCoordBufferRef.current);
        
        // Try to lose context gracefully
        const loseContext = glRef.current.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
    };
  }, []);

  const render = useCallback(() => {
    if (!glRef.current || !programRef.current || !fromImage || !toImage) {
      return;
    }

    const gl = glRef.current;
    const program = programRef.current;

    // Check if images are ready
    const fromReady = fromImage.complete && fromImage.naturalWidth > 0;
    const toReady = toImage.complete && toImage.naturalWidth > 0;

    if (!fromReady || !toReady) {
      return; // Wait for images to load
    }

    // Check for WebGL errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error('❌ WebGL error during render:', error);
      return;
    }

    // Update textures
    if (fromTextureRef.current) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fromTextureRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fromImage);
    }

    if (toTextureRef.current) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, toTextureRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toImage);
    }

    gl.useProgram(program);

    // Set uniforms
    if (uniformsRef.current.u_fromTexture !== null) {
      gl.uniform1i(uniformsRef.current.u_fromTexture, 0);
    }
    if (uniformsRef.current.u_toTexture !== null) {
      gl.uniform1i(uniformsRef.current.u_toTexture, 1);
    }
    if (uniformsRef.current.u_progress !== null) {
      gl.uniform1f(uniformsRef.current.u_progress, internalProgress);
    }
    if (uniformsRef.current.u_resolution !== null) {
      gl.uniform2f(uniformsRef.current.u_resolution, gl.canvas.width, gl.canvas.height);
    }
    if (uniformsRef.current.u_smoothness !== null) {
      gl.uniform1f(uniformsRef.current.u_smoothness, smoothness);
    }
    if (uniformsRef.current.u_center !== null) {
      // Normalize center coordinates to 0-1 range
      const normalizedCenterX = centerX !== undefined ? centerX / gl.canvas.width : 0.5;
      const normalizedCenterY = centerY !== undefined ? centerY / gl.canvas.height : 0.5;
      gl.uniform2f(uniformsRef.current.u_center, normalizedCenterX, normalizedCenterY);
    }

    // Bind position buffer
    if (positionBufferRef.current && positionLocationRef.current !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
      gl.enableVertexAttribArray(positionLocationRef.current);
      gl.vertexAttribPointer(positionLocationRef.current, 2, gl.FLOAT, false, 0, 0);
    }

    // Bind texture coordinates buffer
    if (texCoordBufferRef.current && texCoordLocationRef.current !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRef.current);
      gl.enableVertexAttribArray(texCoordLocationRef.current);
      gl.vertexAttribPointer(texCoordLocationRef.current, 2, gl.FLOAT, false, 0, 0);
    }

    // Draw
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [fromImage, toImage, internalProgress, smoothness, centerX, centerY]);

  // Initialize WebGL when canvas is ready and images are available
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    
    if (isInitializedRef.current) {
      return;
    }
    
    if (!fromImage || !toImage) {
      return;
    }
    
    // Wait for images to be fully loaded
    if (!fromImage.complete || !toImage.complete) {
      return;
    }
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    const cleanup = initWebGL();
    if (cleanup) {
      cleanupRef.current = cleanup;
      isInitializedRef.current = true;
    } else {
      console.error('❌ WebGL initialization failed!');
    }
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [initWebGL, fromImage, toImage]);

  // Track if onComplete has been called to prevent multiple calls
  const onCompleteCalledRef = useRef(false);
  
  // Animate progress
  useEffect(() => {
    // Reset onComplete flag when externalProgress resets
    if (externalProgress !== undefined && externalProgress === 0) {
      onCompleteCalledRef.current = false;
    }
    
    if (externalProgress !== undefined) {
      // Use external progress directly
      setInternalProgress(externalProgress);
      if (externalProgress >= 1.0 && onComplete && !onCompleteCalledRef.current) {
        onCompleteCalledRef.current = true;
        onComplete();
      }
    } else {
      // Animate internally
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
        onCompleteCalledRef.current = false;
      }

      const animate = (currentTime: number) => {
        if (!startTimeRef.current) return;

        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1.0);
        
        setInternalProgress(progress);

        if (progress < 1.0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          if (onComplete && !onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            onComplete();
          }
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        startTimeRef.current = null;
      };
    }
  }, [externalProgress, duration, onComplete]);

  // Render loop - continuously render while transition is active
  useEffect(() => {
    if (!glRef.current || !programRef.current || !fromImage || !toImage) return;

    let isActive = true;

    const renderLoop = () => {
      if (!isActive) return;
      
      render();
      
      // Continue rendering while transition is in progress
      if (internalProgress < 1.0) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        // Render one final frame at progress 1.0
        animationFrameRef.current = requestAnimationFrame(() => {
          render();
        });
      }
    };

    renderLoop();

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [render, internalProgress, fromImage, toImage]);

  if (!fromImage || !toImage) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 12, // Above burgundy background (1) and morph overlay (10)
        pointerEvents: 'none',
        backgroundColor: 'transparent',
        ...style,
      }}
    />
  );
}

export default memo(TransitionOverlay);

