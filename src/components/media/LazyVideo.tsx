import { useState, useRef, useEffect } from 'react';
import { useLazyLoad } from '@/hooks/useMediaLoader';
import { motion } from 'framer-motion';

// Fix: Use container ref properly
function useCombinedRef<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as any).current = node;
      }
    });
  };
}

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

/**
 * Lazy-loaded video component
 * Loads video only when in viewport, with poster image fallback
 */
export function LazyVideo({
  src,
  poster,
  autoplay = false,
  loop = true,
  muted = true,
  playsInline = true,
  ...props
}: LazyVideoProps) {
  const [lazyRef, isIntersecting] = useLazyLoad<HTMLDivElement>();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Don't render if src is empty
  if (!src || src.trim() === '') {
    return null;
  }

  useEffect(() => {
    if (isIntersecting && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isIntersecting, shouldLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (autoplay && isIntersecting) {
      video.play().catch((error) => {
        console.warn('Video autoplay failed:', error);
      });
    }
  }, [shouldLoad, autoplay, isIntersecting]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const combinedRef = useCombinedRef(lazyRef);

  return (
    <motion.div
      ref={combinedRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
      whileHover={!isPlaying ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster && poster.trim() !== '' ? poster : undefined}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload="metadata"
          onPlay={handlePlay}
          onPause={handlePause}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          {...props}
        />
      ) : (
        poster && poster.trim() !== '' && (
          <img
            src={poster}
            alt="Video poster"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )
      )}
    </motion.div>
  );
}

