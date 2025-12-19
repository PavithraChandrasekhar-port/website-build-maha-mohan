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
  const [lazyRef, isIntersecting] = useLazyLoad<HTMLImageElement>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
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

  // Don't render if src is empty
  if (!src || src.trim() === '') {
    return null;
  }

  const finalSrcSet = responsive && !srcset && widths
    ? generateSrcSet(src, widths)
    : srcset;

  const finalSizes = responsive && !sizes
    ? generateSizes()
    : sizes;

  useEffect(() => {
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

  const shouldLoad = isIntersecting || isLoaded;
  const displaySrc = shouldLoad ? src : (placeholder || src);

  // Don't render if displaySrc is empty
  if (!displaySrc || displaySrc.trim() === '') {
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

  const prefersReducedMotion = useReducedMotion();

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

