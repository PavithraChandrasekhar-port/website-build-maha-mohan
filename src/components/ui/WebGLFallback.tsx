import { ReactNode } from 'react';
import { isWebGLSupported } from '@/utils/webgl/context';

interface WebGLFallbackProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that shows fallback content if WebGL is not supported
 */
export function WebGLFallback({ children, fallback }: WebGLFallbackProps) {
  if (!isWebGLSupported()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div style={{ 
        padding: '1rem', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '4px',
        margin: '1rem 0'
      }}>
        <p>WebGL is not supported in your browser. Some visual effects may not be available.</p>
      </div>
    );
  }

  return <>{children}</>;
}

