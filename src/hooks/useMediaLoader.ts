import { useState, useEffect, useRef, RefObject } from 'react';

interface UseLazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading media using Intersection Observer
 */
export function useLazyLoad<T extends HTMLElement>(
  options: UseLazyLoadOptions = {}
): [RefObject<T | null>, boolean] {
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [root, rootMargin, threshold, triggerOnce]);

  return [elementRef, isIntersecting];
}

interface UseImagePreloadOptions {
  src: string;
  srcset?: string;
  sizes?: string;
}

/**
 * Hook for preloading images
 */
export function useImagePreload({ src, srcset, sizes }: UseImagePreloadOptions): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    if (srcset) {
      img.srcset = srcset;
    }
    if (sizes) {
      img.sizes = sizes;
    }
    img.src = src;

    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(false);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, srcset, sizes]);

  return isLoaded;
}

