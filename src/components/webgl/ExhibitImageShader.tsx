import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createTexture, disposeTexture, disposeBuffer } from '@/utils/webgl/buffer';
import { isWebGLSupported, trackContextCreated, trackContextDestroyed } from '@/utils/webgl/context';
import { createShaderProgram, getUniformLocations, getAttributeLocations } from '@/utils/webgl/shader';
import vertexShader from '@/shaders/vertex/passthrough.glsl?raw';
import exhibitImageShader from '@/shaders/fragment/exhibit-image.glsl?raw';

interface ExhibitImageShaderProps {
  imageElement?: HTMLImageElement | null;
  imageUrl?: string;
  scrollProgress?: number; // 0.0 to 1.0
  intensity?: number; // 0.0 to 1.0
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

function ExhibitImageShader({
  imageElement: externalImageElement,
  imageUrl,
  scrollProgress = 0,
  intensity = 1.0,
  className,
  style,
  width,
  height,
}: ExhibitImageShaderProps) {
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
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image from URL if provided
  useEffect(() => {
    if (imageUrl && !externalImageElement) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImage(img);
        imageRef.current = img;
      };
      img.onerror = () => {
        console.error('Failed to load image:', imageUrl);
      };
      img.src = imageUrl;
    } else if (externalImageElement) {
      setLoadedImage(externalImageElement);
      imageRef.current = externalImageElement;
    }
  }, [imageUrl, externalImageElement]);

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
    trackContextCreated();

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvasRef.current || !glRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const clientWidth = width || canvas.clientWidth;
      const clientHeight = height || canvas.clientHeight;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create shader program
    const program = createShaderProgram(gl, vertexShader, exhibitImageShader);
    if (!program) {
      console.error('Failed to create shader program');
      window.removeEventListener('resize', resizeCanvas);
      return () => {};
    }
    programRef.current = program;

    // Get uniform locations
    uniformsRef.current = getUniformLocations(gl, program, [
      'u_texture',
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

    // Create texture
    textureRef.current = gl.createTexture();
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
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [width, height]);

  const render = useCallback(() => {
    const imageElement = externalImageElement || loadedImage;
    if (!glRef.current || !programRef.current || !imageElement || !textureRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const gl = glRef.current;
    const program = programRef.current;

    // Update texture from image
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);

    try {
      if (imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
      } else {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
    } catch (error) {
      console.error('Error updating texture:', error);
      animationFrameRef.current = requestAnimationFrame(render);
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
    if (uniformsRef.current.u_time !== null) {
      gl.uniform1f(uniformsRef.current.u_time, performance.now() * 0.001);
    }
    if (uniformsRef.current.u_scrollProgress !== null) {
      gl.uniform1f(uniformsRef.current.u_scrollProgress, scrollProgress);
    }
    if (uniformsRef.current.u_intensity !== null) {
      gl.uniform1f(uniformsRef.current.u_intensity, intensity);
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

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(render);
  }, [externalImageElement, loadedImage, scrollProgress, intensity]);

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
        disposeTexture(gl, textureRef.current);
        disposeBuffer(gl, positionBufferRef.current);
        disposeBuffer(gl, texCoordBufferRef.current);
        if (programRef.current) {
          gl.deleteProgram(programRef.current);
        }
        trackContextDestroyed();
      }

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [initWebGL]);

  // Start render loop when image is ready
  useEffect(() => {
    const imageElement = externalImageElement || loadedImage;
    if (imageElement && glRef.current && programRef.current) {
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
  }, [externalImageElement, loadedImage, render]);

  if (!isWebGLSupported()) {
    // Fallback to regular img tag
    const imageElement = externalImageElement || loadedImage;
    if (imageElement) {
      return (
        <img
          src={imageElement.src}
          alt=""
          className={className}
          style={style}
          width={width}
          height={height}
        />
      );
    }
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt=""
          className={className}
          style={style}
          width={width}
          height={height}
        />
      );
    }
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        ...style,
      }}
      width={width}
      height={height}
    />
  );
}

export default memo(ExhibitImageShader);

