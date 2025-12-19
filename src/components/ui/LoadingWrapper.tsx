import { useEffect, useState } from 'react';
import LoadingPage from './LoadingPage';
import { preloadHomepageAssets } from '@/utils/loading/preloadAssets';

interface LoadingWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that shows loading page before homepage
 * Shows loading every time the app loads
 */
export default function LoadingWrapper({ children }: LoadingWrapperProps) {
  console.log('[LoadingWrapper] Rendering');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log('[LoadingWrapper] useEffect running, isLoading:', isLoading);
    // Always load assets and show loading page
    const loadAssets = async () => {
      console.log('[LoadingWrapper] Starting asset preload');
      try {
        await preloadHomepageAssets((prog) => {
          console.log('[LoadingWrapper] Progress update:', prog);
          setProgress(prog);
        }, 2000); // Minimum 2 seconds loading time
        
        console.log('[LoadingWrapper] Asset preload complete, hiding loading');
        setIsLoading(false);
      } catch (error) {
        console.error('[LoadingWrapper] Error preloading assets:', error);
        // Still hide loading even if there's an error
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  console.log('[LoadingWrapper] Render - isLoading:', isLoading, 'progress:', progress);

  return (
    <>
      {/* Overlay loading page on top - always show when loading */}
      {isLoading && (
        <LoadingPage 
          progress={progress}
          onComplete={() => setIsLoading(false)}
        />
      )}
      {/* Always render children so routes are mounted */}
      <div style={{ 
        opacity: isLoading ? 0 : 1, 
        transition: 'opacity 0.6s ease-in-out',
        pointerEvents: isLoading ? 'none' : 'auto',
        visibility: isLoading ? 'hidden' : 'visible'
      }}>
        {children}
      </div>
    </>
  );
}
