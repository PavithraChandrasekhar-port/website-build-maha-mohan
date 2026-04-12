import { useState, useEffect } from 'react';
import ShaderCanvas from '@/components/webgl/ShaderCanvas';
import { createQuadBuffer } from '@/utils/webgl/buffer';
import passthroughVertex from '@/shaders/vertex/passthrough.glsl?raw';
import gradientFragment from '@/shaders/fragment/gradient.glsl?raw';
import noiseFragment from '@/shaders/fragment/noise.glsl?raw';

/**
 * Playground component for testing shader effects
 */
export default function ShaderTest() {
  const [shaderType, setShaderType] = useState<'gradient' | 'noise'>('gradient');
  const [time, setTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTime((Date.now() - startTime) / 1000);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  const handleFrame = (
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    uniforms: Record<string, WebGLUniformLocation | null>
  ) => {
    // Set up quad buffer
    const buffer = createQuadBuffer(gl);
    if (!buffer) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    if (positionLocation !== -1) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // Set uniforms
    if (uniforms.u_time) {
      gl.uniform1f(uniforms.u_time, time);
    }
    if (uniforms.u_resolution) {
      gl.uniform2f(uniforms.u_resolution, gl.canvas.width, gl.canvas.height);
    }
    if (uniforms.u_mouse) {
      gl.uniform2f(uniforms.u_mouse, gl.canvas.width / 2, gl.canvas.height / 2);
    }

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Shader Test Playground</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setShaderType('gradient')}>Gradient Shader</button>
        <button onClick={() => setShaderType('noise')}>Noise Shader</button>
      </div>
      <div style={{ width: '800px', height: '600px', border: '1px solid #ccc' }}>
        <ShaderCanvas
          vertexShader={passthroughVertex}
          fragmentShader={shaderType === 'gradient' ? gradientFragment : noiseFragment}
          uniforms={['u_time', 'u_resolution', 'u_mouse']}
          attributes={['a_position', 'a_texCoord']}
          onFrame={handleFrame}
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}

