import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedImageProps extends HTMLMotionProps<'img'> {
  src: string;
  alt: string;
}

/**
 * Image with fade-in and scale animation
 * Optimized for GPU acceleration
 */
export function AnimatedImage({ src, alt, ...props }: AnimatedImageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.img
      src={src}
      alt={alt}
      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        willChange: 'transform, opacity',
        ...props.style,
      }}
      {...props}
    />
  );
}

