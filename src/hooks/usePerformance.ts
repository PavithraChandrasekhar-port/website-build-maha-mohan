import { useEffect, useState } from 'react';
import { performanceMonitor, type PerformanceMetrics } from '@/utils/performance/monitor';

/**
 * Hook for monitoring performance metrics
 */
export function usePerformance(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    performanceMonitor.start();
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      unsubscribe();
      performanceMonitor.stop();
    };
  }, [enabled]);

  return metrics;
}

