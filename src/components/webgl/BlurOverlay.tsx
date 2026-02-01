import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createTexture, disposeTexture, disposeBuffer } from '@/utils/webgl/buffer';
import { isWebGLSupported, trackContextCreated, trackContextDestroyed } from '@/utils/webgl/context';
import { createShaderProgram } from '@/utils/webgl/shader';
import vertexShader from '@/shaders/vertex/passthrough.glsl?raw';
import blurShader from '@/shaders/fragment/blur.glsl?raw';

interface BlurOverlayProps {
  videoElement?: HTMLVideoElement | null;
  imageElement?: HTMLImageElement | null;
  blurIntensity: number; // 0.0 to 1.0
  blurRadius?: number; // Blur radius multiplier (default: 20.0)
  burgundyIntensity?: number; // Burgundy tint strength (default: 0.32)
  className?: string;
  style?: React.CSSProperties;
}

function BlurOverlay({ 
  videoElement, 
  imageElement,
  blurIntensity,
  blurRadius = 20.0,
  burgundyIntensity = 0.32,
  className,
  style 
}: BlurOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const texCoordBufferRef = useRef<WebGLBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const positionLocationRef = useRef<number>(-1);
  const texCoordLocationRef = useRef<number>(-1);
  const [webglFailed, setWebglFailed] = useState(false);
  const [tooManyContexts, setTooManyContexts] = useState(false);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);
  const [restoreCount, setRestoreCount] = useState(0); // Increment when restore succeeds so render effect re-runs
  const restoreAttemptRef = useRef(false); // Prevent multiple restore attempts

  const initWebGL = useCallback(() => {
    if (!canvasRef.current || !isWebGLSupported()) {
      return () => {};
    }

    const canvas = canvasRef.current;
    
    // If we already have a context, don't create a new one
    if (glRef.current) {
      return () => {};
    }
    
    // Check if canvas already has a context (from previous mount)
    // Note: getContext returns null if context was lost, so we need to check differently
    try {
      // Try to get existing context without creating a new one
      const testCanvas = document.createElement('canvas');
      const testContext = testCanvas.getContext('webgl');
      if (testContext) {
        // WebGL is supported, now check if our canvas has an existing context
        // We can't directly check, but we can try to lose it if it exists
        const extension = testContext.getExtension('WEBGL_lose_context');
        if (extension) {
          // This is a workaround - we'll lose any existing context on cleanup
        }
      }
    } catch (e) {
      // Context might already be lost, which is fine
    }
    
    // Create new context - browser will handle context limits
    const gl = canvas.getContext('webgl', { 
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false
    }) as WebGLRenderingContext | null;

    if (!gl) {
      // Check if WebGL is supported but context creation failed (likely too many contexts)
      if (isWebGLSupported()) {
        console.warn('WebGL context creation failed - likely too many contexts');
        setTooManyContexts(true);
        // Only set failed if we've attempted restore, otherwise try restore first
        if (hasAttemptedRestore) {
          setWebglFailed(true);
        } else {
          // Try restore before giving up (only if not already attempted)
          if (!hasAttemptedRestore) {
            setTimeout(() => attemptWebGLRestore(), 100);
          } else {
            setWebglFailed(true);
          }
        }
      }
      return () => {};
    }

    // Check if context is already lost
    if (gl.isContextLost()) {
      console.warn('WebGL context is lost during initialization');
      if (hasAttemptedRestore) {
        setWebglFailed(true);
      } else {
        // Will be handled by context lost event listener
      }
      return () => {};
    }

    glRef.current = gl;
    trackContextCreated();
    setWebglFailed(false); // Reset failed state on successful init
    setHasAttemptedRestore(false); // Reset restore attempt flag on successful init
    restoreAttemptRef.current = false; // Reset restore attempt ref

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
    resizeHandlerRef.current = resizeCanvas;

    // Create shader program
    const program = createShaderProgram(gl, vertexShader, blurShader);
    if (!program) {
      console.error('Failed to create shader program');
      window.removeEventListener('resize', resizeCanvas);
      resizeHandlerRef.current = null;
      return () => {};
    }

    programRef.current = program;
    gl.useProgram(program);

    // Get uniform locations
    uniformsRef.current = {
      u_texture: gl.getUniformLocation(program, 'u_texture'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_blurIntensity: gl.getUniformLocation(program, 'u_blurIntensity'),
      u_blurRadius: gl.getUniformLocation(program, 'u_blurRadius'),
      u_burgundyIntensity: gl.getUniformLocation(program, 'u_burgundyIntensity'),
      u_time: gl.getUniformLocation(program, 'u_time'),
    };

    // Get attribute locations
    positionLocationRef.current = gl.getAttribLocation(program, 'a_position');
    texCoordLocationRef.current = gl.getAttribLocation(program, 'a_texCoord');

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

    // Setup texture
    textureRef.current = createTexture(gl);
    if (textureRef.current) {
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // Setup rendering state
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
    };
  }, []); // Empty deps - only initialize once

  // Attempt to restore/remount WebGL context (defined after initWebGL)
  const attemptWebGLRestore = useCallback(() => {
    if (restoreAttemptRef.current || !canvasRef.current || hasAttemptedRestore) {
      return;
    }
    
    restoreAttemptRef.current = true;
    console.log('Attempting WebGL context restoration...');
    
    // Clean up existing context references
    if (glRef.current) {
      try {
        const extension = glRef.current.getExtension('WEBGL_lose_context');
        if (extension) {
          extension.loseContext();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      glRef.current = null;
      trackContextDestroyed();
    }
    
    // Clear refs
    programRef.current = null;
    textureRef.current = null;
    positionBufferRef.current = null;
    texCoordBufferRef.current = null;
    
    // Cancel any ongoing animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Wait a bit then try to reinitialize
    setTimeout(() => {
      restoreAttemptRef.current = false;
      setHasAttemptedRestore(true);
      
      // Try to reinitialize WebGL
      initWebGL();
      
      // Check if restoration was successful (check after a brief delay to allow init)
      setTimeout(() => {
        if (glRef.current && !glRef.current.isContextLost() && programRef.current) {
          console.log('WebGL context restored successfully');
          setWebglFailed(false);
          setHasAttemptedRestore(false); // Allow future restore attempts
          setRestoreCount((c) => c + 1); // Re-run render effect to restart blur loop
        } else {
          console.warn('WebGL context restoration failed - using solid color fallback');
          setWebglFailed(true);
        }
      }, 100);
    }, 200);
  }, [hasAttemptedRestore, initWebGL]);

  const render = useCallback(() => {
    const mediaElement = videoElement || imageElement;
    if (!glRef.current || !programRef.current || !mediaElement || !textureRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const gl = glRef.current;
    const program = programRef.current;

    // Update texture from video or image
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    
    try {
      // Check if media element is still valid and has dimensions
      // For images, check complete status; for videos, check readyState
      const isReady = imageElement 
        ? imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0
        : videoElement 
          ? videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0
          : false;
      
      if (isReady) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mediaElement);
      } else {
        // If element is not ready, skip this frame but continue for videos
        if (videoElement) {
          animationFrameRef.current = requestAnimationFrame(render);
        }
        return;
      }
    } catch (error) {
      console.error('Error updating texture:', error);
      // Continue rendering loop for videos even on error
      if (videoElement) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
      return;
    }

    gl.useProgram(program);

    // Set uniforms
    if (uniformsRef.current.u_texture !== null) {
      gl.uniform1i(uniformsRef.current.u_texture, 0);
    }
    if (uniformsRef.current.u_resolution !== null) {
      gl.uniform2f(uniformsRef.current.u_resolution, gl.canvas.width, gl.canvas.height);
    }
    if (uniformsRef.current.u_blurIntensity !== null) {
      gl.uniform1f(uniformsRef.current.u_blurIntensity, blurIntensity);
    }
    if (uniformsRef.current.u_blurRadius !== null) {
      gl.uniform1f(uniformsRef.current.u_blurRadius, blurRadius);
    }
    if (uniformsRef.current.u_burgundyIntensity !== null) {
      gl.uniform1f(uniformsRef.current.u_burgundyIntensity, burgundyIntensity);
    }
    if (uniformsRef.current.u_time !== null) {
      gl.uniform1f(uniformsRef.current.u_time, performance.now() * 0.001);
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

    // For videos, continue animation loop; for images, render once
    if (videoElement) {
    animationFrameRef.current = requestAnimationFrame(render);
    } else {
      animationFrameRef.current = null;
    }
  }, [videoElement, imageElement, blurIntensity, blurRadius, burgundyIntensity]);

  // Initialize WebGL only once - use ref to track initialization
  const isInitializedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Only initialize if not already initialized
    if (isInitializedRef.current) {
      return;
    }
    
    // Clean up any existing context first
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    // Clean up any existing resize handler
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }
    
    const cleanup = initWebGL();
    cleanupRef.current = cleanup;
    isInitializedRef.current = true;
    
    return () => {
      // Cancel any pending animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clean up WebGL resources
      if (glRef.current) {
        const gl = glRef.current;
        
        // Clean up resources
        if (textureRef.current) {
          disposeTexture(gl, textureRef.current);
          textureRef.current = null;
        }
        if (positionBufferRef.current) {
          disposeBuffer(gl, positionBufferRef.current);
          positionBufferRef.current = null;
        }
        if (texCoordBufferRef.current) {
          disposeBuffer(gl, texCoordBufferRef.current);
          texCoordBufferRef.current = null;
        }
        if (programRef.current) {
          gl.deleteProgram(programRef.current);
          programRef.current = null;
        }
        
        // Lose the WebGL context explicitly
        const canvas = canvasRef.current;
        if (canvas) {
          const extension = gl.getExtension('WEBGL_lose_context');
          if (extension) {
            extension.loseContext();
          }
        }
        
        trackContextDestroyed();
        glRef.current = null;
      }
      
      // Clean up resize handler
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      
      isInitializedRef.current = false;
    };
  }, []); // Only initialize once on mount

  useEffect(() => {
    const mediaElement = videoElement || imageElement;
    if (!glRef.current || !programRef.current || !mediaElement) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // For images, wait until loaded before rendering
    if (imageElement) {
      if (imageElement.complete && imageElement.naturalWidth > 0) {
        // Image is already loaded, render immediately
        render();
      } else {
        // Wait for image to load
        const handleLoad = () => {
          if (glRef.current && programRef.current) {
            render();
          }
        };
        imageElement.addEventListener('load', handleLoad);
        return () => {
          imageElement.removeEventListener('load', handleLoad);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        };
      }
    } else if (videoElement) {
      // For videos, start rendering loop
      if (videoElement.readyState >= 2) {
        render();
      } else {
        const handleLoadedData = () => {
          if (glRef.current && programRef.current) {
            render();
          }
        };
        videoElement.addEventListener('loadeddata', handleLoadedData);
        return () => {
          videoElement.removeEventListener('loadeddata', handleLoadedData);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        };
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [render, videoElement, imageElement, blurIntensity, blurRadius, burgundyIntensity, restoreCount]);


  // Handle WebGL context lost/restored events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleContextLost = (e: Event) => {
      e.preventDefault(); // Prevent default behavior
      console.warn('WebGL context lost');
      
      // Check if it's due to too many contexts
      const errorEvent = e as any;
      if (errorEvent.statusMessage && errorEvent.statusMessage.includes('context')) {
        setTooManyContexts(true);
      }
      
      // Try to restore before falling back to solid color
      if (!hasAttemptedRestore && !restoreAttemptRef.current) {
        attemptWebGLRestore();
      } else {
        // Already attempted restore or in progress - use solid fallback
        setWebglFailed(true);
      }
    };
    
    const handleContextRestored = () => {
      console.log('WebGL context restored by browser');
      setWebglFailed(false);
      setHasAttemptedRestore(false);
      restoreAttemptRef.current = false;
      // Reinitialize if needed
      if (!glRef.current && canvasRef.current) {
        initWebGL();
      }
    };
    
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [hasAttemptedRestore, attemptWebGLRestore]);

  // If WebGL is not supported at all, return null (no fallback)
  if (!isWebGLSupported()) {
    return null;
  }

  // Always render the canvas so it stays mounted - required for restore to re-init WebGL.
  // When context is lost and restore failed, overlay the burgundy fallback on top.
  const showFallbackOverlay = webglFailed && hasAttemptedRestore;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          ...style,
        }}
      />
      {showFallbackOverlay && (
        <div
          className={className}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            backgroundColor: '#561D3C', // Burgundy fallback
            ...style,
          }}
        />
      )}
    </>
  );
}

// Memoize to prevent unnecessary remounts on scroll
// Only re-render if critical props change
export default memo(BlurOverlay, (prevProps, nextProps) => {
  // Re-render if any critical prop changes
  if (prevProps.videoElement !== nextProps.videoElement) return false;
  if (prevProps.imageElement !== nextProps.imageElement) return false;
  if (prevProps.blurIntensity !== nextProps.blurIntensity) return false;
  if (prevProps.blurRadius !== nextProps.blurRadius) return false;
  if (prevProps.burgundyIntensity !== nextProps.burgundyIntensity) return false;
  if (prevProps.className !== nextProps.className) return false;
  // Props are equal, don't re-render
  return true;
});

