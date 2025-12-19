import { ReactNode } from 'react';
import { MediaProvider } from './MediaContext';
import { NavigationProvider } from './NavigationContext';
import { WebGLProvider } from './WebGLContext';

/**
 * Combined provider for all global state contexts
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WebGLProvider>
      <MediaProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </MediaProvider>
    </WebGLProvider>
  );
}

