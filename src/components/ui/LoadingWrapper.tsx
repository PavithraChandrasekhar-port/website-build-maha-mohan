import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingPage from './LoadingPage';
import { preloadHomepageAssets } from '@/utils/loading/preloadAssets';

interface LoadingWrapperProps {
  children: React.ReactNode;
}

// Global flag to track if initial homepage load has completed
let initialHomepageLoadComplete = false;

/**
 * Wrapper component that shows loading page before homepage
 * Shows loading only on initial homepage load, not on navigation
 */
export default function LoadingWrapper({ children }: LoadingWrapperProps) {
  console.log('[LoadingWrapper] Rendering');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(!initialHomepageLoadComplete && location.pathname === '/');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Only show loading on initial homepage load
    if (!initialHomepageLoadComplete && location.pathname === '/') {
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
          initialHomepageLoadComplete = true;
          setIsLoading(false);
        } catch (error) {
          console.error('[LoadingWrapper] Error preloading assets:', error);
          // Still hide loading even if there's an error
          initialHomepageLoadComplete = true;
          setIsLoading(false);
        }
      };

      loadAssets();
    } else {
      // If already loaded or not on homepage, don't show loading
      setIsLoading(false);
    }
  }, [location.pathname]);

  console.log('[LoadingWrapper] Render - isLoading:', isLoading, 'progress:', progress, 'pathname:', location.pathname);

  return (
    <>
      {/* Overlay loading page on top - only show when loading homepage */}
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
