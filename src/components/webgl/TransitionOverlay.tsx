import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createTexture, disposeTexture, disposeBuffer } from '@/utils/webgl/buffer';
import { isWebGLSupported } from '@/utils/webgl/context';
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
  // Phase 1.1: Component mount logging
  useEffect(() => {
    console.log('🎬 TransitionOverlay mounted');
    console.log('📊 Props:', { 
      fromImage: fromImage ? { src: fromImage.src, width: fromImage.naturalWidth, height: fromImage.naturalHeight } : null,
      toImage: toImage ? { src: toImage.src, width: toImage.naturalWidth, height: toImage.naturalHeight } : null,
      progress: externalProgress,
      centerX,
      centerY,
      duration,
      smoothness,
    });
    return () => console.log('🎬 TransitionOverlay unmounted');
  }, []);

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
  
  // Phase 7.1: Progress Animation Logging
  useEffect(() => {
    // Log progress updates at key milestones
    const milestone = Math.floor(internalProgress * 10) / 10;
    const prevMilestone = Math.floor((internalProgress - 0.001) * 10) / 10;
    
    if (milestone !== prevMilestone && milestone <= 1.0) {
      console.log('📈 Progress updated:', internalProgress.toFixed(3), `(${(milestone * 100).toFixed(0)}%)`);
    }
  }, [internalProgress]);

  const initWebGL = useCallback(() => {
    // Phase 2.1: WebGL Context Creation
    console.log('🔧 Initializing WebGL...');
    
    if (!canvasRef.current) {
      console.error('❌ Canvas ref is null');
      return () => {};
    }
    
    if (!isWebGLSupported()) {
      console.error('❌ WebGL not supported');
      return () => {};
    }
    
    const canvas = canvasRef.current;
    
    if (glRef.current) {
      console.log('⚠️ WebGL context already exists');
      return () => {};
    }
    
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null;

    if (!gl) {
      console.error('❌ Failed to get WebGL context');
      return () => {};
    }

    // Phase 2.1: Log WebGL context info
    console.log('✅ WebGL context created:', {
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      contextLost: gl.isContextLost(),
    });

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

    // Phase 2.2: Shader Compilation
    console.log('🔨 Compiling shaders...');
    
    // Compile vertex shader manually for detailed error reporting
    const vertexShaderObj = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShaderObj) {
      console.error('❌ Failed to create vertex shader object');
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
    gl.shaderSource(vertexShaderObj, vertexShader);
    gl.compileShader(vertexShaderObj);
    if (!gl.getShaderParameter(vertexShaderObj, gl.COMPILE_STATUS)) {
      console.error('❌ Vertex shader compilation failed');
      const error = gl.getShaderInfoLog(vertexShaderObj);
      console.error('Vertex shader error log:', error);
      gl.deleteShader(vertexShaderObj);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
    console.log('✅ Vertex shader compiled');
    
    // Compile fragment shader manually for detailed error reporting
    const fragShaderObj = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragShaderObj) {
      console.error('❌ Failed to create fragment shader object');
      gl.deleteShader(vertexShaderObj);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
    gl.shaderSource(fragShaderObj, transitionShader);
    gl.compileShader(fragShaderObj);
    if (!gl.getShaderParameter(fragShaderObj, gl.COMPILE_STATUS)) {
      console.error('❌ Fragment shader compilation failed');
      const error = gl.getShaderInfoLog(fragShaderObj);
      console.error('Fragment shader error log:', error);
      gl.deleteShader(vertexShaderObj);
      gl.deleteShader(fragShaderObj);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
    console.log('✅ Fragment shader compiled');
    
    // Phase 2.3: Program Linking
    console.log('🔗 Linking shader program...');
    const program = gl.createProgram();
    if (!program) {
      console.error('❌ Failed to create program');
      gl.deleteShader(vertexShaderObj);
      gl.deleteShader(fragShaderObj);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
    
    gl.attachShader(program, vertexShaderObj);
    gl.attachShader(program, fragShaderObj);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('❌ Program linking failed');
      const error = gl.getProgramInfoLog(program);
      console.error('Link error:', error);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShaderObj);
      gl.deleteShader(fragShaderObj);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
    console.log('✅ Shader program linked');
    
    // Clean up shader objects (they're attached to program now)
    gl.deleteShader(vertexShaderObj);
    gl.deleteShader(fragShaderObj);

    programRef.current = program;
    gl.useProgram(program);

    // Phase 2.3: Get uniform and attribute locations
    uniformsRef.current = {
      u_fromTexture: gl.getUniformLocation(program, 'u_fromTexture'),
      u_toTexture: gl.getUniformLocation(program, 'u_toTexture'),
      u_progress: gl.getUniformLocation(program, 'u_progress'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_smoothness: gl.getUniformLocation(program, 'u_smoothness'),
      u_center: gl.getUniformLocation(program, 'u_center'),
    };
    
    console.log('📍 Uniforms:', {
      u_fromTexture: uniformsRef.current.u_fromTexture !== null,
      u_toTexture: uniformsRef.current.u_toTexture !== null,
      u_progress: uniformsRef.current.u_progress !== null,
      u_resolution: uniformsRef.current.u_resolution !== null,
      u_smoothness: uniformsRef.current.u_smoothness !== null,
      u_center: uniformsRef.current.u_center !== null,
    });
    
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
    
    console.log('📍 Attributes:', {
      a_position: positionLocationRef.current !== -1,
      a_texCoord: texCoordLocationRef.current !== -1,
    });
    
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

    // Phase 3.1: Texture Creation
    console.log('🖼️ Creating textures...');
    fromTextureRef.current = createTexture(gl);
    toTextureRef.current = createTexture(gl);
    
    console.log('🖼️ Textures created:', {
      fromTexture: fromTextureRef.current !== null,
      toTexture: toTextureRef.current !== null,
    });
    
    // Check for errors
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error('❌ WebGL error after texture creation:', error);
    } else {
      console.log('✅ Textures created successfully');
    }

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
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error('❌ WebGL error before render:', error);
      return;
    }

    // Phase 3.2: Image Data Upload
    // Log first frame only to avoid spam
    const isFirstFrame = !fromTextureRef.current || !toTextureRef.current;
    
    if (isFirstFrame) {
      console.log('📤 Uploading textures:', {
        fromImage: {
          src: fromImage.src,
          width: fromImage.naturalWidth,
          height: fromImage.naturalHeight,
          complete: fromImage.complete,
        },
        toImage: {
          src: toImage.src,
          width: toImage.naturalWidth,
          height: toImage.naturalHeight,
          complete: toImage.complete,
        },
      });
    }

    // Update textures
    if (fromTextureRef.current) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fromTextureRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fromImage);
      
      error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('❌ Error uploading fromImage texture:', error);
      } else if (isFirstFrame) {
        console.log('✅ fromImage texture uploaded');
      }
    }

    if (toTextureRef.current) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, toTextureRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toImage);
      
      error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('❌ Error uploading toImage texture:', error);
      } else if (isFirstFrame) {
        console.log('✅ toImage texture uploaded');
      }
    }
    
    // Phase 3.3: Verify Texture Binding (first frame only)
    if (isFirstFrame) {
      const boundTexture0 = gl.getParameter(gl.TEXTURE_BINDING_2D);
      gl.activeTexture(gl.TEXTURE1);
      const boundTexture1 = gl.getParameter(gl.TEXTURE_BINDING_2D);
      gl.activeTexture(gl.TEXTURE0); // Reset to TEXTURE0
      
      console.log('🔗 Texture bindings:', {
        TEXTURE0: boundTexture0 === fromTextureRef.current,
        TEXTURE1: boundTexture1 === toTextureRef.current,
      });
    }

    gl.useProgram(program);

    // Phase 4.1: Set Uniforms (log first frame only)
    const isFirstFrameUniforms = internalProgress === 0 || internalProgress < 0.01;
    
    if (isFirstFrameUniforms) {
      console.log('🎛️ Setting uniforms:', {
        u_progress: internalProgress,
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_smoothness: smoothness,
        u_center: [
          centerX !== undefined ? centerX / gl.canvas.width : 0.5,
          centerY !== undefined ? centerY / gl.canvas.height : 0.5,
        ],
      });
    }
    
    if (uniformsRef.current.u_fromTexture !== null) {
      gl.uniform1i(uniformsRef.current.u_fromTexture, 0);
    } else if (isFirstFrameUniforms) {
      console.error('❌ u_fromTexture uniform not found');
    }
    
    if (uniformsRef.current.u_toTexture !== null) {
      gl.uniform1i(uniformsRef.current.u_toTexture, 1);
    } else if (isFirstFrameUniforms) {
      console.error('❌ u_toTexture uniform not found');
    }
    
    if (uniformsRef.current.u_progress !== null) {
      gl.uniform1f(uniformsRef.current.u_progress, internalProgress);
      if (isFirstFrameUniforms) {
        console.log('✅ u_progress set to:', internalProgress);
      }
    } else if (isFirstFrameUniforms) {
      console.error('❌ u_progress uniform not found');
    }
    
    if (uniformsRef.current.u_resolution !== null) {
      gl.uniform2f(uniformsRef.current.u_resolution, gl.canvas.width, gl.canvas.height);
      if (isFirstFrameUniforms) {
        console.log('✅ u_resolution set to:', [gl.canvas.width, gl.canvas.height]);
      }
    } else if (isFirstFrameUniforms) {
      console.error('❌ u_resolution uniform not found');
    }
    
    if (uniformsRef.current.u_smoothness !== null) {
      gl.uniform1f(uniformsRef.current.u_smoothness, smoothness);
      if (isFirstFrameUniforms) {
        console.log('✅ u_smoothness set to:', smoothness);
      }
    } else if (isFirstFrameUniforms) {
      console.error('❌ u_smoothness uniform not found');
    }
    
    if (uniformsRef.current.u_center !== null) {
      // Normalize center coordinates to 0-1 range
      const normalizedCenterX = centerX !== undefined ? centerX / gl.canvas.width : 0.5;
      const normalizedCenterY = centerY !== undefined ? centerY / gl.canvas.height : 0.5;
      gl.uniform2f(uniformsRef.current.u_center, normalizedCenterX, normalizedCenterY);
      if (isFirstFrameUniforms) {
        console.log('✅ u_center set to:', [normalizedCenterX, normalizedCenterY]);
      }
    } else if (isFirstFrameUniforms) {
      console.error('❌ u_center uniform not found');
    }

    // Phase 4.2: Bind Attributes (log first frame only)
    const isFirstFrameAttributes = internalProgress === 0 || internalProgress < 0.01;
    
    if (positionBufferRef.current && positionLocationRef.current !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
      gl.enableVertexAttribArray(positionLocationRef.current);
      gl.vertexAttribPointer(positionLocationRef.current, 2, gl.FLOAT, false, 0, 0);
      if (isFirstFrameAttributes) {
        console.log('✅ Position attribute enabled');
      }
    } else if (isFirstFrameAttributes) {
      console.error('❌ Position attribute not set up');
    }

    if (texCoordBufferRef.current && texCoordLocationRef.current !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRef.current);
      gl.enableVertexAttribArray(texCoordLocationRef.current);
      gl.vertexAttribPointer(texCoordLocationRef.current, 2, gl.FLOAT, false, 0, 0);
      if (isFirstFrameAttributes) {
        console.log('✅ Texture coordinate attribute enabled');
      }
    } else if (isFirstFrameAttributes) {
      console.error('❌ Texture coordinate attribute not set up');
    }

    // Phase 5.2: Draw Call (log first frame and every 10% progress)
    const shouldLogDraw = isFirstFrameAttributes || Math.floor(internalProgress * 10) !== Math.floor((internalProgress - 0.001) * 10);
    
    if (shouldLogDraw) {
      console.log('🎨 Drawing frame:', {
        progress: internalProgress.toFixed(3),
        vertexCount: 4,
      });
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error('❌ WebGL error after draw:', error);
    } else if (shouldLogDraw) {
      console.log('✅ Draw call succeeded');
    }
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

  // Phase 5.1: Render Loop
  useEffect(() => {
    if (!glRef.current || !programRef.current || !fromImage || !toImage) {
      console.log('⏹️ Render loop not started - missing dependencies');
      return;
    }

    let isActive = true;
    let frameCount = 0;
    const startTime = performance.now();

    const renderLoop = () => {
      if (!isActive) {
        console.log('⏹️ Render loop stopped');
        return;
      }
      
      const frameStart = performance.now();
      render();
      const frameTime = performance.now() - frameStart;
      frameCount++;
      
      if (frameTime > 16) {
        console.warn('⚠️ Slow frame:', frameTime.toFixed(2), 'ms');
      }
      
      // Log every 60 frames (roughly once per second at 60fps)
      if (frameCount % 60 === 0) {
        const elapsed = performance.now() - startTime;
        console.log(`🔄 Render loop active: ${frameCount} frames, ${elapsed.toFixed(0)}ms elapsed, progress: ${internalProgress.toFixed(3)}`);
      }
      
      // Continue rendering while transition is in progress
      if (internalProgress < 1.0) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        // Render one final frame at progress 1.0
        console.log('✅ Render loop complete');
        animationFrameRef.current = requestAnimationFrame(() => {
          render();
        });
      }
    };

    console.log('🚀 Starting render loop');
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

  // Phase 1.2: Canvas visibility verification
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const styles = getComputedStyle(canvas);
      console.log('🎨 Canvas styles:', {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position,
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      });
      
      // Verify canvas exists in DOM
      const canvasInDOM = document.querySelector('canvas');
      console.log('🔍 Canvas in DOM:', canvasInDOM !== null);
    }
  }, []);

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

