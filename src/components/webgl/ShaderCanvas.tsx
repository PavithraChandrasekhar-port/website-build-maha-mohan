import { memo } from 'react';
import { useWebGL } from '@/hooks/useWebGL';

interface ShaderCanvasProps {
  vertexShader: string;
  fragmentShader: string;
  uniforms?: string[];
  attributes?: string[];
  onFrame?: (gl: WebGLRenderingContext, program: WebGLProgram, uniforms: Record<string, WebGLUniformLocation | null>) => void;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

const ShaderCanvas = memo(({
  vertexShader,
  fragmentShader,
  uniforms = [],
  attributes = [],
  onFrame,
  className,
  style,
  width,
  height,
}: ShaderCanvasProps) => {
  const { canvasRef, error } = useWebGL({
    vertexShader,
    fragmentShader,
    uniforms,
    attributes,
    onFrame,
    autoResize: !width && !height,
  });

  if (error) {
    return (
      <div className={className} style={style}>
        <p>WebGL Error: {error}</p>
      </div>
    );
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
});

ShaderCanvas.displayName = 'ShaderCanvas';

export default ShaderCanvas;

