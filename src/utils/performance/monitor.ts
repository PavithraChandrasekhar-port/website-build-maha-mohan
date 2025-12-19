/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private frameTime = 0;
  private rafId: number | null = null;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  start() {
    if (this.rafId !== null) return;

    const measure = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      this.frameTime = deltaTime;
      this.fps = 1000 / deltaTime;
      this.frameCount++;
      this.lastTime = currentTime;

      const metrics: PerformanceMetrics = {
        fps: this.fps,
        frameTime: this.frameTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      };

      this.listeners.forEach((listener) => listener(metrics));

      this.rafId = requestAnimationFrame(measure);
    };

    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Log performance warning if FPS drops below threshold
 */
export function checkPerformance(threshold: number = 30) {
  const metrics = performanceMonitor.getMetrics();
  if (metrics.fps < threshold && metrics.fps > 0) {
    console.warn(`Low FPS detected: ${metrics.fps.toFixed(2)}fps`);
  }
}

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  if (duration > 16) {
    console.warn(`Slow operation "${name}": ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Async version of measurePerformance
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (duration > 16) {
    console.warn(`Slow async operation "${name}": ${duration.toFixed(2)}ms`);
  }

  return result;
}

