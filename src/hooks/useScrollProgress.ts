import { useState, useEffect } from 'react';

/**
 * Hook to track scroll progress
 * Returns a value between 0 and 1 based on scroll position
 */
export function useScrollProgress(threshold: number = 500): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const normalizedProgress = Math.min(scrollY / threshold, 1);
      setProgress(normalizedProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return progress;
}

