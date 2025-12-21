import { useEffect, useState } from 'react';
import LoadingPage from './LoadingPage';
import { preloadHomepageAssets } from '@/utils/loading/preloadAssets';

interface LoadingWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that shows loading page before homepage
 * Only shows loading page once at the beginning of the website (not between pages)
 */
export default function LoadingWrapper({ children }: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if this is the very first visit ever (not a refresh/reload)
    // Use localStorage to persist across sessions - only show on first visit ever
    const hasVisitedBefore = localStorage.getItem('mahaMohanHasVisited');
    
    // Allow forcing reload with ?forceLoading=true query param (for development)
    const urlParams = new URLSearchParams(window.location.search);
    const forceLoading = urlParams.get('forceLoading') === 'true';
    
    // Show loading page ONLY on first visit ever
    // - Initial page load (first visit): YES - show loading
    // - Page refresh (F5): NO - skip loading (hasVisitedBefore is true)
    // - Browser reload: NO - skip loading (hasVisitedBefore is true)
    // - Client-side navigation: NO - component doesn't remount (already handled)
    
    if (hasVisitedBefore === 'true' && !forceLoading) {
      // User has visited before - skip loading page
      setIsLoading(false);
      return;
    }

    // This is the first visit - show loading page and preload assets
    const loadAssets = async () => {
      try {
        await preloadHomepageAssets((prog) => {
          setProgress(prog);
        }, 2000); // Minimum 2 seconds loading time
        
        // Mark that user has visited (persists across sessions)
        localStorage.setItem('mahaMohanHasVisited', 'true');
        setIsLoading(false);
      } catch (error) {
        console.error('Error preloading assets:', error);
        // Still mark as visited even if there's an error
        localStorage.setItem('mahaMohanHasVisited', 'true');
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

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
