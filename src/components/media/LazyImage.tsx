import { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useLazyLoad } from '@/hooks/useMediaLoader';
import { generateSrcSet, generateSizes } from '@/utils/media/breakpoints';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  srcset?: string;
  sizes?: string;
  placeholder?: string;
  responsive?: boolean;
  widths?: number[];
  onLoad?: () => void;
}

/**
 * Lazy-loaded image component with responsive breakpoints
 * Uses Intersection Observer for viewport-based loading
 */
export const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(({
  src,
  alt,
  srcset,
  sizes,
  placeholder,
  responsive = true,
  widths,
  onLoad: onLoadProp,
  ...props
}, forwardedRef) => {
  // CRITICAL: All hooks must be at the top level, called unconditionally
  // Hooks must be called in the same order on every render
  
  // 1. Custom hooks
  const [lazyRef, isIntersecting] = useLazyLoad<HTMLImageElement>();
  const prefersReducedMotion = useReducedMotion();
  
  // 2. State hooks
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 3. Effect hooks
  useEffect(() => {
    // Check condition inside the hook, not before calling it
    if (!src || src.trim() === '') {
      return;
    }
    
    if (isIntersecting && !isLoaded && !hasError) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setIsLoaded(true);
        onLoadProp?.();
      };
      img.onerror = () => setHasError(true);
    }
  }, [isIntersecting, src, isLoaded, hasError, onLoadProp]);
  
  // All hooks are now at the top - rest of component logic below
  // Combine refs
  const ref = (node: HTMLImageElement | null) => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
    // lazyRef is a RefObject, not a function
    if (lazyRef) {
      lazyRef.current = node;
    }
  };

  // Calculate values after hooks (conditions moved inside hooks)
  const hasValidSrc = src && src.trim() !== '';
  const finalSrcSet = hasValidSrc && responsive && !srcset && widths
    ? generateSrcSet(src, widths)
    : srcset;

  const finalSizes = hasValidSrc && responsive && !sizes
    ? generateSizes()
    : sizes;

  const shouldLoad = isIntersecting || isLoaded;
  const displaySrc = shouldLoad && hasValidSrc ? src : (hasValidSrc ? (placeholder || src) : null);

  // Render null if no valid src (but hooks were still called)
  if (!hasValidSrc || !displaySrc || displaySrc.trim() === '') {
    return null;
  }

  if (hasError && placeholder) {
    return (
      <img
        ref={ref}
        src={placeholder}
        alt={alt}
        {...props}
      />
    );
  }

  return (
    <motion.img
      ref={ref}
      src={displaySrc}
      alt={alt}
      srcSet={finalSrcSet}
      sizes={finalSizes}
      loading="lazy"
      onLoad={() => {
        setIsLoaded(true);
        onLoadProp?.();
      }}
      onError={() => setHasError(true)}
      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: shouldLoad ? 1 : 0.5, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        willChange: 'transform, opacity',
        ...props.style,
      }}
      {...(props as any)}
    />
  );
});

LazyImage.displayName = 'LazyImage';

